---
layout: post
title: "构建 Discord -> Obsidian 工作流"
tags: [PKM, Obsidian, Discord, 自动化]
date: 2025-8-10
comments: true
author: helpfulcraft
---

### 背景

长时间的积累下，许多知识记录了，但后续的整理、查阅始终是个问题。我的目标是构建一个完善的个人知识管理系统，其核心是：用最低的摩擦力捕捉灵感，并将其沉淀到一个可二次加工的知识库中

经过多轮选型，我确定了最终的组合：
*   **捕捉端：Discord**：这是我每天使用的快捷记录工具，创建一个私人服务器，用不同频道，如 `#灵感` `#思考`分类记录
*   **沉淀端：Obsidian**：obsidian强大的知识管理能力能将孤立的笔记编织成网

---

### 1. 初始尝试：n8n 的webhook问题

我首先选择 **n8n** 作为自动化的中转工具。经过一番折腾，我用它的 Webhook 节点与 Discord Bot 实现了对接

但后面n8n 测试环境 URL能通过 Discord 的交互测试，而生产环境 URL discord始终拒绝。缺乏可供分析的日志。面对这个无法诊断的问题，我只能放弃

---

### 2. Pipedream

为了增加灵活性，我采用了 `Discord -> Pipedream -> Make.com` 的架构

> **第一次尝试**
>
> Pipedream提供的AI工具创建的代理在配置监听频道时，返回 `Showing 0 option`。尽管我确认机器人拥有管理员权限，但仍然报错无法加载频道列表
> 
> **第二次尝试**
>
> 我打开了一个新的对话窗口，把要求精简再次发给AI。第二次的流程没有问题，成功生成了一个 Webhook URL

搭建好Pipedream的工作流流后，AI助手会提供部署的预制组件按钮

---

### 3.  Make.com 的 `[400]` 

数据成功从 Pipedream 转发到了 Make，但卡在了 `[400] Invalid request` 报错

#### 3.1 空的输入数据

我运行流程，`OneDrive` 模块立刻报错。从日志中可以发现：Make 传递给 OneDrive 模块的所有数据字段**全部是空的**。

> **解决方案：Redetermine data structure**
>
> 1.  在 Make 的编辑器中，右键点击 `Webhooks` 模块
> 2.  选择 `Redetermine data structure` 
> 3.  在 Discord 发送一条新的消息
>
> Make提示“Successfully determined”

#### 3.2 修正数据映射

再次运行，错误依旧。但这次日志指出数据是完整的

仔细比对 `Webhook` 模块输出的真实数据结构，和 `OneDrive` 中填写的变量，我发现我沿用了之前在n8n的错误逻辑

 **多一层映射**

 *  频道名： ` {{1.data.channel.name}} ` 
 *  频道名：` {{1.channel.name}} `


修改为正确的映射，设置好目录后，discord指定频道新发送的消息，会以一个独立的md文件形式出现在指定目录

### 总结

> **架构**:
> `Discord` (捕捉) -> `Pipedream` (监听) -> `Make` (接收、上传) -> `OneDrive` (云端) -> `Obsidian` (处理)
>
> **越简单越好**：n8n 的失败源自复杂的自定义配置，而Pipedream把组件的开发、Discord的对接等功能封装好了，通过AI助手可以自动化生成可用的配置