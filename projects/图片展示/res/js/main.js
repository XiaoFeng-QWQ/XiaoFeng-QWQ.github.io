var imageURL; // 在全局范围内定义imageURL变量
const infoElement = document.querySelector('.info');
const tipsElement = document.querySelector('.tips');

/**
 * 保存图片
 */
function saveImage() {
    infoElement.textContent = `开始请求下载惹！`
    const downloadLink = document.createElement('a');
    downloadLink.href = imageURL;
    downloadLink.download = `${imageURL}.png`; // 保存文件名
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
    downloadLink.click(); // 触发下载链接的点击事件
    URL.revokeObjectURL(imageURL); // 释放内存
}

/**
 * 请求图片
 */
async function fetchImage() {
    infoElement.textContent = `获取中，请稍后......`;
    try {
        const response = await fetch("https://t.alcy.cc/pc/");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        imageURL = URL.createObjectURL(blob);
        document.body.style.backgroundImage = `url('${imageURL}')`;

        infoElement.textContent = `获取: ${imageURL} 成功！`;
    } catch (error) {
        console.error(`发生致命错误: ${error}`);
        infoElement.textContent = `发生致命错误: ${error} 请刷新重试`;
    }
}

/**
 * 点击切换全屏模式
 */
function fullScreenElement() {
    if (document.fullscreenElement) {
        infoElement.style.display = 'block'
        tipsElement.style.display = 'block'
        document.exitFullscreen();
    } else {
        infoElement.style.display = 'none'
        tipsElement.style.display = 'none'
        document.documentElement.requestFullscreen();
    }
};

document.addEventListener('fullscreenchange', handleFullscreenChange);
/**
 * 用于配合监听全屏状态
 */
function handleFullscreenChange() {
    if (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
        infoElement.style.display = 'none'
        tipsElement.style.display = 'none'
    } else {
        infoElement.style.display = 'block'
        tipsElement.style.display = 'block'
    }
}


fetchImage();