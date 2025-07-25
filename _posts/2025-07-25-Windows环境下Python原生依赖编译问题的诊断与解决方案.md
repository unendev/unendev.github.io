---
layout: post
title: "Windows环境下Python原生依赖编译问题的诊断与解决方案"
date: 2025-07-23 14:00:00 +0800
categories: [技术, 环境配置, Python]
tags: [Windows, Python, Pip, Rust, C++, Build Tools, PyO3, 依赖管理]
comments: true
author: helpfulcraft
---

### 前言
最近使用AntReader这个开源的电子书阅读器学习外语，但发现本身不支持Anki，我只能手动导出数据，解析，再写个python脚本处理成Anki卡片。为了得到高质量的翻译，我打算使用LLM翻译作为卡片内容。不巧的是前段时间为了解决TUN模式失效的问题重装了系统，在安装`openai`库时直接报了一连串的编译错误。折腾了半天，发现问题在于部分依赖（比如`jiter`和`pydantic-core`）需要用到Rust和C++编译器

### 一、准备工作：从微软商店安装Python

- 之前都是去官网下安装包，但这次我选择了直接从微软商店安装Python
- 因为它会自动处理好环境变量（`PATH`）。安装完成后，可以直接在终端使用 `py.exe` 启动器，这在后面管理多个Python版本时特别有用

### 二、找不到Rust

在安装`jiter`这个依赖时失败了，日志里明确指出**找不到Rust工具链**。
现在很多Python库为了追求高性能，会用Rust或C++来写一部分核心代码，`jiter`也是这样，需要手动安装Rust

### 三、缺少C++构建工具

执行Rust安装程序后，日志里会提示**缺少C++构建工具**，并询问是否需要安装。这对于Rust来说是必要的，选择第一个选项即可，会自动下载、安装Visual Studio。安装的等待时间会比较久到怀疑是不是卡住了，但通过任务管理器可以看到仍然不时有cpu占用

### 四、Python版本太新，与PyO3不兼容

> `error: the configured Python interpreter version (3.14) is newer than PyO3's maximum supported version (3.13)`

1.  **指定版本来安装依赖：** 执行`pip`时，用 `-3.12` 参数明确指定使用哪个Python版本
    ```bash
    py -3.12 -m pip install requests openai deep-translator
    ```
2.  **指定版本来运行脚本：** 
    ```bash
    py -3.12 my_anki_script.py
    ```

### 总结

Python环境 -> Rust工具链 (会自动引导) -> C++构建工具 (由Rust引导安装) -> Python版本兼容性 (用py.exe管理)