import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const A4_WIDTH = 592.28;
const A4_HEIGHT = 841.89;

jsPDF.API.output2 = function (outputType = 'save', filename = 'document.pdf') {
  let result = null;
  switch (outputType) {
    case 'file':
      result = new File([this.output('blob')], filename, {
        type: 'application/pdf',
        lastModified: Date.now(),
      });
      break;
    case 'save':
      result = this.save(filename);
      break;
    default:
      result = this.output(outputType);
  }
  return result;
};

jsPDF.API.addBlank = function (x, y, width, height) {
  this.setFillColor(255, 255, 255);
  this.rect(x, y, Math.ceil(width), Math.ceil(height), 'F');
};

jsPDF.API.toCanvas = async function (element, width) {
  const canvas = await html2canvas(element, {
    dpi: 300,
    allowTaint: true,
  });
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  //console.log(canvasHeight);
  const height = (width / canvasWidth) * canvasHeight;
  const canvasData = canvas.toDataURL('image/jpeg', 1.0);
  return { width, height, data: canvasData };
};

jsPDF.API.addHeader = async function (x, width, header) {
  if (!(header instanceof HTMLElement)) return;
  let __header;
  if (this.__header) {
    __header = this.__header;
  } else {
    __header = await this.toCanvas(header, width);
    this.__header = __header;
  }
  const { height, data } = __header;
  this.addImage(data, 'JPEG', x, 0, width, height);
};

jsPDF.API.addFooter = async function (x, width, footer) {
  if (!(footer instanceof HTMLElement)) return;
  let __footer;
  /* if (this.__footer) {
    ///__footer = this.__footer;
  } else {
    __footer = await this.toCanvas(footer, width);
    this.__footer = __footer;
  } */
  __footer = await this.toCanvas(footer, width);
  const { height, data } = __footer;
  this.addImage(data, 'JPEG', x, A4_HEIGHT - height, width, height);
};

/**
 * 生成pdf(处理多页pdf截断问题)
 * @param {Object} param
 * @param {HTMLElement} param.element - 需要转换的dom根节点
 * @param {number} [param.contentWidth=550] - 一页pdf的内容宽度，0-592.28
 * @param {number} [param.contentHeight=800] - 一页pdf的内容高度，0-841.89
 * @param {string} [param.outputType='save'] - 生成pdf的数据类型，添加了'file'类型，其他支持的类型见http://raw.githack.com/MrRio/jsPDF/master/docs/jsPDF.html#output
 * @param {string} [param.filename='document.pdf'] - pdf文件名
 * @param {number} param.x - pdf页内容距页面左边的高度，默认居中显示，为(A4宽度 - contentWidth) / 2)
 * @param {number} param.y - pdf页内容距页面上边的高度，默认居中显示，为(A4高度 - contentHeight) / 2)
 * @param {HTMLElement} param.header - 页眉dom元素
 * @param {HTMLElement} param.footer - 页脚dom元素
 * @param {boolean} [param.headerOnlyFirst=true] - 是否只在第一页添加页眉
 * @param {boolean} [param.footerOnlyLast=true] - 是否只在最后一页添加页脚
 * @param {string} [param.mode='adaptive'] - 生成pdf的模式，支持'adaptive'、'fixed'，'adaptive'需给dom添加标识，'fixed'需固定布局。
 * @param {string} [param.itemName='item'] - 给dom添加元素标识的名字，'adaptive'模式需在dom中设置
 * @param {string} [param.groupName='group'] - 给dom添加组标识的名字，'adaptive'模式需在dom中设置
 * @returns {Promise} 根据outputType返回不同的数据类型
 */
async function outputPdf({
  element, contentWidth = 550, contentHeight = 800,
  outputType = 'save', filename = 'document.pdf', x, y,
  header, footer, headerOnlyFirst = true, footerOnlyLast = true,
  mode = 'adaptive', itemName = 'item', groupName = 'group',
}) {
  if (!(element instanceof HTMLElement)) {
    throw new Error('The root element must be HTMLElement.');
  }

  const pdf = new jsPDF({
    unit: 'pt',
    format: 'a4',
    orientation: 'p',
  });
  const { width, height, data } = await pdf.toCanvas(element, contentWidth);
  const baseX = x == null ? (A4_WIDTH - contentWidth) / 2 : x;
  const baseY = y == null ? (A4_HEIGHT - contentHeight) / 2 : y;
  async function addHeader(isFirst) {
    if (isFirst) {
      await pdf.addHeader(baseX, contentWidth, header);
    }
  }
  async function addFooter(isLast, pageNum, now) {
    if (isLast) {
      const newFooter = footer.cloneNode(true);
      newFooter.querySelector('.pdf-footer-page').innerText = now;
      newFooter.querySelector('.pdf-footer-page-count').innerText = pageNum;
      document.documentElement.append(newFooter);
      await pdf.addFooter(baseX, contentWidth, newFooter);
      //document.doc
    }
  }
  function addImage(_x, _y) {
    pdf.addImage(data, 'JPEG', _x, _y, width, height);
  }

  function addNormalPage(_x, _y, footer) {
    const { height: footerHeight } = footer;
    pdf.addImage(data, 'JPEG', _x, _y, width, height - footerHeight);
  }

  function addMyImage(_x, _y, mWidth, mHeight) {
    pdf.addImage(data, 'JPEG', _x, _y, mWidth, mHeight)
  }

  const params = {
    element, contentWidth, contentHeight, itemName, groupName,
    pdf, baseX, baseY, width, height, addImage, addNormalPage, addHeader, addFooter, footer, header, addMyImage, filename
  };
  await myOutput(params);
  //return pdf.output2(outputType, filename);
}


/**
 * 生成pdf(处理多页pdf截断问题)
 * @param {Object} param
 * @param {HTMLElement} param.element - 需要转换的dom根节点
 * 
 * */
async function myOutput({ element, contentWidth, contentHeight, itemName, groupName,
  pdf, baseX, baseY, width, height, addImage, addHeader, addFooter, footer, header, filename }) {

  //return;

  // 获取页脚的高度
  const { height: footerHeight } = await pdf.toCanvas(footer, contentWidth);
  // 获取页头的高度
  const { height: headerHeight } = await pdf.toCanvas(header, contentWidth);
  // 出去页头页尾后每页的高度
  const originalPageHeight = (contentHeight - footerHeight - headerHeight);
  // 记录每一页的截取位置

  //const els = [];
  // 元素的宽度
  const elementWidth = element.offsetWidth;

  const componentPanel = element.querySelector('.KFCP-PDF');
  // 每一页的高度
  const paegs = [contentWidth / elementWidth * (componentPanel.offsetTop)];

  /*  const elementWidth = element.offsetWidth;
   const { offsetHeight: oh, offsetTop:ct, clientTop, } =element.querySelector('.KFCP-PDF');
   console.log({ clientTop, ct,element }) */
  // 普通元素更新位置
  // 普通元素只需要考虑到是否到达了分页点，即当前距离顶部高度 - 上一个分页点的高度 大于 正常一页的高度，则需要载入分页点 
  function updateNomalElPos(eheight, top) {
    if (top - (paegs.length > 0 ? paegs[paegs.length - 1] : 0) > originalPageHeight) {
      //console.log({ top: top, one: one });
      paegs.push((paegs.length > 0 ? paegs[paegs.length - 1] : 0) + originalPageHeight);
      //els.push(one);
      return true;
    }
  }

  // 需要考虑分页元素，则需要考虑两种情况
  // 1. 当前距离顶部高度加上元素自身高度 大于 整页高度，则需要载入一个分页点
  // 2. 普通达顶情况，如上
  function updatePos(eheight, top, one) {
    //console.log({ top: top });
    // 如果头部已经超过当前页，则证明可以分页了
    if (top - (paegs.length > 0 ? paegs[paegs.length - 1] : 0) > originalPageHeight) {
      //console.log({ top: top, one: one });
      paegs.push((paegs.length > 0 ? paegs[paegs.length - 1] : 0) + originalPageHeight);
      return true;
    }
    // 距离当前页顶部的高度, 如果元素跨页，则将当前高度作为分页位置，推进
    else if ((top + eheight - (paegs.length > 0 ? paegs[paegs.length - 1] : 0) > originalPageHeight) && (top != (paegs.length > 0 ? paegs[paegs.length - 1] : 0))) {
      //console.log({ top: top, one: one });
      paegs.push(top);
      return true;
    }
    // 更新正常位置
    //res.push(pos);
    //pos += contentHeight;
  }

  // 获取距离页面顶部的距离
  // 通过遍历offsetParant获取距离顶端元素的高度值
  function getElementTop(element) {
    var actualTop = element.offsetTop;
    var current = element.offsetParent;

    while (current && current !== null) {
      actualTop += current.offsetTop;
      current = current.offsetParent;
    }
    return actualTop;
  }

  // 遍历富文本元素
  // 我使用的富文本元素为一列一列的 ，因此只需要判断一维情况，不需要深入判断
  function traversingEditor(nodes) {

    for (let i = 0; i < nodes.length; ++i) {
      const one = nodes[i];
      let { offsetHeight, clientTop, scrollTop, top: ot } = one;
      let offsetTop = getElementTop(one);
      const top = contentWidth / elementWidth * (offsetTop)
      updatePos(contentWidth / elementWidth * offsetHeight, top, one);
    }
  }

  // const allTableRows = element.querySelectorAll('')
  // 遍历正常的元素节点
  function traversingNodes(nodes) {

    for (let i = 0; i < nodes.length; ++i) {
      const one = nodes[i];
      // 图片元素不需要继续深入，作为深度终点
      const isIMG = one.tagName === 'IMG';
      //const isTable = one.classList && ((one.classList.contains('.ant-table')));
      // 需要继续深入的节点
      const isPreviewItem = one.classList && ((one.classList.contains('preview-item')));
      // 深度终点
      const isTableCol = one.classList && ((one.classList.contains('ant-table-row')));
      // 特殊的富文本元素
      const isEditor = one.classList && (one.classList.contains('pdf-editor-content'));
      // 对需要处理分页的元素，计算是否跨界，若跨界，则直接将顶部位置作为分页位置，进行分页，且子元素不需要再进行判断
      let { offsetHeight, clientTop, scrollTop, top: ot } = one;
      // 计算出最终高度
      let offsetTop = getElementTop(one);
      //let offsetHeight = one.getBoundingClientRect().top + document.documentElement.scrollTop;
      // dom转换后距离顶部的高度
      //const top =  contentWidth / elementWidth * (clientTop - element.clientTop);
      /* if (!offsetTop) {
        traversingNodes(one.childNodes);
        continue;
        //offsetTop = one.offsetParent.offsetTop;
      } */
      // 转换成canvas高度
      const top = contentWidth / elementWidth * (offsetTop)
      //console.log({top, one});
      // 对于需要进行分页且内部存在需要分页（即不属于深度终点）的元素进行处理
      if (isPreviewItem) {
        //console.log({ height: contentWidth / elementWidth * offsetHeight, top })
        updatePos(contentWidth / elementWidth * offsetHeight, top, one);
        traversingNodes(one.childNodes);
      }
      // 对于富文本元素进行分页判断
      else if (isEditor) {
        // updatePos(contentWidth / elementWidth * offsetHeight, top, one);
        traversingEditor(one.childNodes);
      }
      // 对于深度终点元素进行处理
      else if (isTableCol || isIMG) {
        // dom高度转换成生成pdf的实际高度
        // 代码不考虑dom定位、边距、边框等因素，需在dom里自行考虑，如将box-sizing设置为border-box
        //console.log({top, one})
        //console.log( { top, offsetHeight, nowTop: paegs[paegs.length - 1] } );
        updatePos(contentWidth / elementWidth * offsetHeight, top, one);
        // 当深度终点元素高度大于一页时，对内部元素判断是否越界
        if (isTableCol && offsetHeight > originalPageHeight) {
          traversingNodes(one.childNodes)
        }
        //traversingNodes(one.childNodes);
        //traversingNodes(one.childNodes);
        //console.log({ offsetTop })
      }
      // 对于普通元素，则判断是否高度超过分页值，并且深入
      else {
        //console.log({ ot })
        //updatePos(contentWidth / elementWidth * offsetHeight, top);
        //updatePos(contentWidth / elementWidth * offsetHeight, top);
        updateNomalElPos(contentWidth / elementWidth * offsetHeight, top)
        traversingNodes(one.childNodes);
      }
    }
    return;
  }

  try {
    // 分页处理好后
    traversingNodes(element.querySelector('.KFCP-PDF').childNodes);
    // 判断最后一位是否盈余，需要
    if (paegs[paegs.length - 1] + originalPageHeight < height) {
      paegs.push(paegs[paegs.length - 1] + originalPageHeight);
    }
    //console.log(element.offsetHeight)
    //addImage(baseX, baseY, contentWidth, element.offsetHeight * contentWidth / elementWidth);
    //return pdf.output2('save', 'ce')
    // 除了封面外正常页面的高度
    //const normalPageHeight = contentHeight - footerHeight - headerHeight;

    // 根据分页位置
    for (let i = 0; i <= paegs.length; ++i) {
      if (i === 0) {
        //console.log(baseY - i * contentHeight)
        addImage(baseX, baseY - i * contentHeight);
        //addMyImage(baseX, baseY, contentWidth, paegs[0]);
        pdf.addPage();
      }
      else {
        addImage(baseX, baseY - paegs[i - 1]);
        // 对于除最后一页外，多余的部分进行遮白处理
        if (i != paegs.length) {
          const imageHeight = paegs[i] - paegs[i - 1];
          pdf.addBlank(0, baseY + imageHeight, A4_WIDTH, A4_HEIGHT - (baseY + imageHeight));
        }

        await addHeader(i !== 0, paegs.length);
        await addFooter(i !== 0, paegs.length, i);
        if (i !== paegs.length) {
            // 增加分页
          pdf.addPage();
          //addImage(baseX, baseY - paegs[i] - normalPageHeight);
        }
      }
    }
    return pdf.output2('save', filename)
  } catch (error) {
    throw new Error(error);
  }


}

export default outputPdf;