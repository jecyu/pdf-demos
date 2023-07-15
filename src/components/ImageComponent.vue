<template>
    <div class="divide-inside">
        <div style="padding: 10px; color: rgba(0,0,0,0.85); font-weight: bold;text-align: left; padding-bottom: 20px; border-bottom: 1px solid #eee;"> 图片代表需要进行跨页判断，但内部不含有 `可能跨页/需要进行跨页判断` 的节点， 即深度终点 
        </div>
        <img :src="TestImage" style="max-width: 100%; max-height: 800px; margin-top: 100px;"/>
    </div>
</template>


<script>
    import TestImage from './test.png';
    export default {
        data() {
            return {
                TestImage
            }
        }
    }
</script>