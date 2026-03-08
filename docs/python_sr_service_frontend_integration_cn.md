# 前端对接文档（视频上传与视频超分）

## 1. 适用范围
- 项目：`picture-backend`
- 基础路径：`/api`
- 目标：前端完成“上传视频 -> 创建视频超分任务 -> 查询任务进度与结果”

## 2. 返回结构约定
所有接口统一返回：

```json
{
  "code": 0,
  "data": {},
  "message": "ok"
}
```

- `code=0` 代表成功
- 非 0 代表失败，`message` 为错误信息

## 3. 鉴权说明
- 需要登录态（Sa-Token）
- 上传接口 `POST /api/picture/upload` 含 `@OnceTokenRequired`，前端需带一次性令牌相关 Cookie（按现有登录态流程即可）

## 4. 视频上传接口

### 4.1 上传文件（支持视频）
- 方法：`POST`
- 路径：`/api/picture/upload`
- Content-Type：`multipart/form-data`

表单字段：
- `file`：视频文件（必填）
- `mediaType`：固定传 `video`（建议必传）
- `picName`：资源名称（可选）
- `spaceId`：空间 ID（可选）
  - 不传：公共空间
  - 传值：私有或团队空间
- `id`：仅“覆盖更新已有资源”时传（可选）

视频文件限制：
- 仅支持文件上传，不支持 URL 上传视频
- 大小上限：`200MB`
- 支持后缀：`mp4/mov/mkv/avi/webm/m4v`

请求示例（curl）：
```bash
curl -X POST "http://localhost:8123/api/picture/upload" \
  -H "Cookie: sa_token=xxx; sec_token=xxx" \
  -F "file=@D:/demo/demo.mp4" \
  -F "mediaType=video" \
  -F "picName=演示视频" \
  -F "spaceId=1945054164708327426"
```

成功返回 `data`（`PictureVO`）关键字段：
- `id`：资源 ID（后续可直接用于创建视频超分）
- `url`：视频 URL（已入库）
- `picFormat`：如 `mp4`
- `spaceId`

### 4.2 URL 上传（仅图片）
- `POST /api/picture/upload/url` 仍是图片链路，不支持视频 URL

## 5. 空间支持说明（视频上传）
- 公共空间：支持（`spaceId` 不传）
- 私有空间：支持（`spaceId` 传私有空间）
- 团队空间：支持（`spaceId` 传团队空间）
- 权限沿用现有图片上传权限体系（公共/私有/团队）

## 6. 创建视频超分任务

### 6.1 接口
- 方法：`POST`
- 路径：`/api/sr/task/create`
- Content-Type：`application/json`

### 6.2 请求参数（推荐）
```json
{
  "type": "video",
  "pictureId": 2026999999999999999,
  "scale": 2,
  "modelName": "realesr-animevideov3",
  "modelVersion": "v1.0.0",
  "videoOptions": {
    "keepAudio": true,
    "extractFrameFirst": true,
    "fpsOverride": 23.976
  }
}
```

说明：
- `type`：`video`
- `pictureId` 与 `inputFileKey` 二选一，建议前端传 `pictureId`
- `scale`：仅支持 `2` 或 `4`
- `videoOptions.fpsOverride`：可选，必须 `> 0`

返回：
```json
{
  "code": 0,
  "data": 1772601597,
  "message": "ok"
}
```
其中 `data` 为 `taskId`。

## 7. 查询任务进度

### 7.1 查询单任务
- `GET /api/sr/task/get/vo?id={taskId}`

返回 `SrTaskVO` 关键字段：
- `id/taskNo`
- `bizType`（`video`）
- `status`：`QUEUED/RUNNING/SUCCEEDED/FAILED/CANCELLED`
- `progress`：0~100
- `outputFileKey`
- `errorCode/errorMsg`
- `videoOptionsJson`

### 7.2 查询我的任务列表
- `POST /api/sr/task/list/page/my/vo`

请求示例：
```json
{
  "current": 1,
  "pageSize": 20,
  "status": "RUNNING"
}
```

## 8. 查询超分结果

### 8.1 我的结果
- `POST /api/sr/task/result/list/page/my/vo`

请求示例：
```json
{
  "current": 1,
  "pageSize": 20,
  "bizType": "video"
}
```

### 8.2 团队空间结果
- `POST /api/sr/task/result/list/page/space/vo`

请求示例：
```json
{
  "current": 1,
  "pageSize": 20,
  "spaceId": 1945054164708327426,
  "bizType": "video"
}
```

返回 `SrTaskResultVO` 关键字段：
- `taskId/taskNo/bizType`
- `outputFileKey/outputUrl`
- `outputFormat/outputSize`
- `durationMs/fps/bitrateKbps/codec`
- `costMs/attempt`

## 9. 前端推荐流程
1. 调 `POST /api/picture/upload` 上传视频，拿到 `pictureId`
2. 调 `POST /api/sr/task/create`，传 `type=video + pictureId`
3. 轮询 `GET /api/sr/task/get/vo?id=...` 查看进度
4. 任务成功后调用结果分页接口，读取 `outputUrl` 播放或下载

## 10. 常见错误与排查
- `视频仅支持文件上传`：错误使用了 `/picture/upload/url`
- `视频类型错误`：文件后缀不在允许列表
- `视频大小不能超过 200MB`：超出上传大小限制
- `type 仅支持 image 或 video`：任务类型传值错误
- `video 任务必须传 inputFileKey 或 pictureId`：任务入参缺失
- `fpsOverride 必须 > 0`：视频参数非法

## 11. 联调检查清单
1. 前端上传视频后，`PictureVO.url` 可访问
2. `sr/task/create` 返回 `taskId`
3. 任务可收到 `RUNNING -> SUCCEEDED/FAILED`
4. 成功后 `result` 接口能查到 `bizType=video` 记录
5. `outputUrl` 可直接用于播放器播放（建议 H.264 兼容播放器）
