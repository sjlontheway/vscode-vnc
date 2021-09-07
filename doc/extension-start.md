# Vscode Extension 开发

### 入门
`vscode extension` 通过 `yo` 脚手架初始化项目，通过脚手架初始化好项目之后，点击 `F5` ，即可对插件进行调试，此时会弹出一个新的加载好调试插件的 vscode 窗口。具体步骤如下:

```shell
  npm install -g yo generator-code
  yo code

  # ? What type of extension do you want to create? New Extension (TypeScript)
  # ? What's the name of your extension? HelloWorld
  ### Press <Enter> to choose default for all options below ###

  # ? What's the identifier of your extension? helloworld
  # ? What's the description of your extension? LEAVE BLANK
  # ? Initialize a git repository? Yes
  # ? Bundle the source code with webpack? No
  # ? Which package manager to use? npm

  code ./helloworld
```

### 可扩展的功能

 - 通用扩展
  通用扩展功能是任何插件都可以使用的核心功能：
   1. 命令注册，配置参数，按键绑定，上下文菜单选项
   2. 存贮工作共建以及全局数据
   3. 显示通知消息
   4. 使用 Quick Pick 来获取用户输入
   5. 打开系统文件选择器来选择文件或者文件夹
   6. 使用进度条 API 来表示长任务的执行

- 扩展主题
  主题可以控制代码编辑器的颜色，vscode UI 的颜色， 将现有的 TextMate 主题移植到 vscode， 增加自定义文件图标


- 声明式编程语言特性
  声明式的语法提示可以通过文本编辑的方式为编程语言添加括号不全，自动缩进以及语法高亮功能，
   1. 可以定制js 代码片段到插件 
   2. 声明一种新的编程语言
   3. 增加或者替换编程语言的语法
   4. 继承扩展已经存在的语法
   5. 导入TextMate 语法到 vscode


- 可编程的语言特征
  编程语言特征添加丰富的编程语言辅助支持,比如悬停语法提示，跳转至定义处，错误自动诊断提示，语法智能提示以及代码长度，
  这些语言特性通过 `vscode.languages.*` API 来公开。插件可以直接利用这些公开的 API 来写一个编程语言服务，通过 VS Code `Languages Server library` 来适配这些功能

  尽管vscode 已经提供了丰富的语言特性及其预期的一系列用途，但开发者仍然可以扩展他的功能。例如，CodeLens 和 Hover 是一种很好的内联显示附加信息的方式，而诊断错误可用于突出显示拼写或代码风格错误。

  可扩展的方向
  1. 悬停显示API的使用实例
  2. 运用错误诊断提示源码拼写错误或者语法风格错误
  3. 为HTML注册新的代码格式
  4. 提供丰富的，上下文感知的IntelliSense（智能编辑）
  5. 为语言增加折叠、面包屑和大纲支持

- 工作台插件

  工作台插件继承工作台UI。为文件管理器增加新的右键响应操作，扩展文件管理器右键菜单功能，或利用vscode TreeView API 构建一个自定义的资源管理器。如果插件需要完全自定义交互界面，插件可通过前端技术（HTML/CSS/JS）构建特有的文件预览或者UI

  可扩展的方向
  1. 增加文件管理器上下文菜单功能
  2. 在侧边栏创建新的、可交互的资源管理器
  3. 定义一个新的活动视图栏
  4. 在状态栏展示信的信息
  5. 通过自定义Webview渲染自定义内容
  6. 贡献源码控制提供程序

- 调试功能
  插件可以通过编写将vscode的调试UI连接到特定调试器或运行时的调试器扩展来利用vscode的调试功能

扩展思路

1. 通过贡献调试适配器实现，将 VS Code 的调试 UI 连接到调试器或运行时。
2. 指定调试器扩展支持的语言。
3. 为调试器使用的调试配置属性提供丰富的 IntelliSense 和悬停信息。
4. 提供调试配置片段。

另一方面，VS Code 还提供了一组 Debug Extension API，您可以使用它在任何 VS Code 调试器之上实现调试相关的功能，以自动化用户的调试体验。
扩展思路
1. 根据动态创建的调试配置启动调试会话。
2. 跟踪调试会话的生命周期。
3. 以编程方式创建和管理断点。

