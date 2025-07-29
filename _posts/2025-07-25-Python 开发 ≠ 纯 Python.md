---
layout: post
title: "Python开发 ≠ 纯Python"
tags: [Windows, Python, Rust, C++, 依赖]
comments: true
author: helpfulcraft
---

### 背景：自动化的翻译制卡需求

我最近在用一款开源电子书阅读器 `AnxReader` 学外语。它功能齐全，但无法直接与 Anki（一款卡片式记忆软件） 联动，我每次都需要手动导出数据库进行解析，再整理成 Anki 卡片，过程相当繁琐

方便起见，我写了一个python脚本来进行自动化制卡。因为阅读器本身支持LLM翻译，在制卡时我选择了使用DeepSeek进行翻译

但前段时间的一次重装系统清除了本地的所有依赖，甚至Python本身，我需要重新安装一切

### 一、Python安装选择


一直以来我都是通过“下载安装包、手动配置环境变量”的方式安装python。但这次访问官网，我意外发现官方有一个推荐的安装方式，**从微软商店下载**。经过查阅，我得知这种方式有以下几点优势：

1.  **自动管理环境**：它会自动处理好 `PATH` 环境变量，避免手动配置可能带来的疏漏和冲突
2.  **使用 `py.exe` 启动器**：当系统中存在多个版本时，可通过 `py -3.12 ...` 精确调用特定版本的解释器来执行脚本或安装包，无需手动修改环境变量

### 二、找不到 Rust与缺少 C++ 工具集

安装`opneai`库时，日志指出依赖另一个库`jiter`，而在安装jiter时，日志又指出找不到 Rust 工具链，从而导致安装失败

*   **Rust/C++重写核心逻辑**：经过查阅，我发现这是现代 Python 生态的一个趋势。为了追求极致的性能，许多现代 Python 库（尤其是数据处理和Web框架相关的底层库）的核心部分正采用 Rust 或 C++ 重写，然后通过语言绑定（如 PyO3）暴露给 Python 使用。`jiter` (一个 JIT 编译器) 正是这类库的典型代表。它们不再是纯 Python 代码，而是需要在用户本地编译的原生依赖
*   **安装Rust**：往 [Rust 官网](https://www.rust-lang.org/tools/install) 下载运行 `rustup-init.exe`。
   
运行`rustup-init.exe`后，日志第一时间指出找不到C++构建工具，并给出了**是否下载`Visual Studio Installer`**的选项。我的`Visual Studio`也因为重装系统而丢失了，尽管本体存储在其他磁盘，可工具集的调用链被斩断了，为了避免不必要的麻烦，我选择重新安装一遍

   - **补全`C++`工具集**：`Visual Studio Installer` 是小型化的社区版的Visual Studio安装器，不需要像正常Installer那样选择安装的工具集，默认只有两个工具集
        > **注意**：安装 Visual Studio 的过程较长，会在    **90%** 的进度“卡住”，最后一下子安装成功。通过任务管理器可以发现Installer仍然存在CPU占用

### 三、Python 版本太新

```
error: the configured Python interpreter version (3.14) is newer than PyO3's maximum supported version (3.13)
```
官网默认安装的python版本为最新版，而依赖的支持没有跟上。这里`py.exe`的优势就体现了出来
*   **使用 `py.exe` 启动器**
    1. **安装 python 3.12**
    2. **直接指定版本安装依赖，无需修改环境变量**

        ```bash
        # 指定 Python 3.12 来安装依赖
        py -3.12 -m pip install openai deep-translator

        # 指定 Python 3.12 来运行脚本
        py -3.12 my_anki_script.py
        ```

### 总结

>1.  **Python 开发 ≠ 纯 Python**：高性能 Python 库往往通过Rust/C++实现性能优化的。这是一种通用的优化方式，正如UE开发中通常使用C++编写蓝图核心逻辑以优化性能
>2.  **工具链环环相扣**： `pip` -> `Rust`  -> `C++ 构建工具`
>3.  **多版本环境下的版本管理**：正如 `py.exe` 解决了 Python 多版本共存的问题，我在 `Node.js` 中也曾因版本不匹配而焦头烂额。理解并善用各个系统提供的版本管理工具（如 `py.exe`、`nvm` ），是确保稳定开发的关键