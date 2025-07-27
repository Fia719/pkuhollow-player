## 树洞重映
在使用[树洞导出插件](https://greasyfork.org/zh-CN/scripts/465805-pku-hole-export-tool)将关注的树洞导出后，会得到导出的txt文件和json文件，其中txt文件可以直接阅读，而json文件可以在导入至[https://treehole-player.vercel.app/](https://treehole-player.vercel.app/)网站后，得到接近在树洞直接阅览的效果，目前支持多文件导入，但暂时不支持txt文件导入。

请注意，这是一个纯静态网站，不会将用户导入的数据上传至网络，用户导入的文件只会存储在本地，请大家放心自己的隐私不会泄露。

本网站通过拦截用户发送请求的404回复，使用浏览器缓存替换返回结果以变相实现对api请求的回复，因此会有一些无意义的网络流量产生。

若大家有留言的想法，可以在issue中提交，可以直接提交一个纯文本，也可以指定想要的name以及tag,timestamp等信息，例如：

```json
{
    "cid": 2,
    "pid": 1,
    "text": "大家若有希望展示在这里的留言，可以在Github上提issue留言，有一定概率会被合并入此洞～",
    "timestamp": 1627948170,
    "tag": "Github",
    "comment_id": null,
    "name": "please issue on Github!!",
    "quote": null
}

```