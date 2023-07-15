<template>
  <div class="ctn">
    <div class="pdf-ctn">
        <div class="pdf-panel">
            <div class="pdf-inside-panel">
                <TableComponent></TableComponent>
                <!-- <TableComponent v-for="(item ,index) in 2" :key="index" ></TableComponent> -->
                <!-- <ImageComponent v-for="(item,index) in 3" :key="index + 6"></ImageComponent>
                <RichText v-for="(item, index) in 2" :key="index + 20"></RichText> -->
            </div>
        </div>
        <div class="pdf-header"
            style="font-weight: bold; padding:15px 8px; width: 100%; border-bottom: 1px solid rgba(0, 0, 0, 0.85); color: rgba(0, 0, 0, 0.85); position: fixed; top: -100vh;">
            页头
        </div>
        <div class="pdf-footer"
            style="font-weight: bold; padding: 15px 8px; width: 100%; border-top: 1px solid rgba(0, 0, 0, 0.85); position: fixed; top: -100vh;">
            <div style="display: flex; justify-content: center; align-items: center; padding-top: 5px;">
                我是页尾
            </div>
            <div style="display: flex; justify-content: center; align-items: center; margin-top: 20px;">
                第<div class="pdf-footer-page"></div>页 / 第<div class="pdf-footer-page-count"></div>页
            </div>
        </div>
    </div>
    <div>
      <a-button style="top: 50px; left: 1450px; position: fixed; " @click="handleOutput"> 测试导出 </a-button>
    </div>
  </div>
</template>

<script>
import ImageComponentVue from "./ImageComponent.vue";
import TableComponent from "./tableComponent.vue";
import ImageComponent from "./ImageComponent.vue";
import { outputPDF } from '../outputPDF'
import RichText from "./richText.vue";
import { message } from "ant-design-vue";
export default {
  name: 'HelloWorld',
  props: {
    msg: String
  },
  methods: {
    async handleOutput() {
      const element = document.querySelector('.pdf-panel');
      const header = document.querySelector('.pdf-header');
      const footer = document.querySelector('.pdf-footer');
      try {
        await outputPDF({
          element: element,
          footer: footer,
          header: header,
          contentWidth: 560
        })
      } catch (error) {
        message.error(typeof error === 'string' ? error : JSON.stringify(error))
      }
      
    }
  },
  components: { TableComponent, TableComponent, ImageComponentVue, ImageComponent, RichText }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
.ctn {
  .pdf-ctn {
    // width: 1300px;
    width: 800px;
    .pdf-panel {
      position: relative;
    }
  }
}
</style>
