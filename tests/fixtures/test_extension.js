// 这是测试文件

// 1. 基本的 headers 赋值
const headers = {};
headers["x-onbehalf-extension-id"] = "test-value-1"; // 应被注释
headers["other-header"] = "other-value";

// 2. 对象中间的属性
const config1 = {
    "name": "test1",
    "x-onbehalf-extension-id": `github.copilot/chat`, // 应被替换为 null
    "version": "1.0.0"
};

// 3. 对象末尾的属性
const config2 = {
    "name": "test2",
    "version": "2.0.0",
    "x-onbehalf-extension-id": `${'varA'}/${'varC'}` // 应被替换为 null
};

// 4. 对象开头的属性
const config3 = {
    "x-onbehalf-extension-id": `another/value`, // 应被替换为 null
    "name": "test3",
    "version": "3.0.0"
};

// 5. 单行对象，中间属性
const config4 = { "name": "test4", "x-onbehalf-extension-id": `single/line`, "version": "4.0.0" }; // 应被替换为 null

// 6. 单行对象，末尾属性
const config5 = { "name": "test5", "version": "5.0.0", "x-onbehalf-extension-id": `end/of/line` }; // 应被替换为 null

// 7. 只有该属性的对象
const config6 = { "x-onbehalf-extension-id": `only/property` }; // 应被替换为 null

// 8. 带有不同空格的 headers 赋值
headers  [  "x-onbehalf-extension-id"  ]  =  "test-value-2"  ; // 应被注释

// 9. 带有不同空格的对象属性
const config7 = {
    "name" : "test7" ,
    "x-onbehalf-extension-id" : `spaced / out` , // 应被替换为 null
    "version" : "7.0.0"
} ;

// 其他代码，不应受影响
function testFunction() {
    console.log("This function should remain unchanged.");
    const unrelated = { key: "value" };
}

testFunction();

// 复杂嵌套表达式 (修正了原始语法错误)
// Line 56 - Proxy (保持不变)
new Proxy(this._endpoint,{get:function(f,S,b){return S==="getExtraHeaders"?function(){return{...f.getExtraHeaders?.()??{},"x-onbehalf-extension-id":`${n}/${c}`}}:S==="acquireTokenizer"? /* some condition */ true : false }}); // 应被替换为 null

// Line 57/61 - 修正：将复杂表达式放入对象使其语法有效
const dummyObjForLine61 = {
    someFunc: function(){ return {...E.getExtraHeaders?.()??{}, "x-onbehalf-extension-id": `${o}/${l}`}; }, // 应被替换为 null
    condition: S === "acquireTokenizer" ? true : null // 假设 S 和 E 在某处定义
};