/**
 * 展示独立页面的内容
 */
function showPageHtml() {
    /**
     * Github用户名用于API 
     */
    const githubUserName = `XiaoFeng-QWQ`

    const page1Element = $('#page-1 #readme');
    const page2Element = $('#page-2 #blog');
    const page3Element = $('#page-3');

    const githubApiUrl = `https://api.github.com/users/${githubUserName}`;
    const readmeUrl = `https://raw.githubusercontent.com/${githubUserName}/${githubUserName}/main/README.md`;

    if (page1Element.length > 0) {
        // 创建一个异步函数
        const fetchData = async () => {
            try {
                const response = await fetch(githubApiUrl);
                if (!response.ok) {
                    throw new Error('Failed to fetch user data');
                }
                const data = await response.json();
                const readmeResponse = await fetch(readmeUrl);
                if (!readmeResponse.ok) {
                    throw new Error('Failed to fetch README file');
                }
                const readmeText = await readmeResponse.text();
                const html = `
                <img class="mdui-img-circle" style="max-height: 12rem;" src="${data.avatar_url}" />
                <article class="animate__animated animate__fadeInLeft">${marked.parse(readmeText)}</article>
                `;
                page1Element.html(html);
            } catch (error) {
                console.error(error);
                const html = `
                <img class="mdui-img-circle" style="max-height: 12rem;" src="https://avatars.githubusercontent.com/u/118364173?v=4">
                <article class="animate__animated animate__fadeInLeft"><h2>Hi there 👋</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Base Info</th>
                                <th>Dashboard Data</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    __Hi, I am XiaoFeng-QWQ  __<br><br>1.   I am from China!<br>2.   I like to write code. I don't really play games, okay<br>3.   How to reach me: <a href="mailto:1432777209@qq.com">1432777209@qq.com</a><br></td>
                                <td><a href="https://github.com/anuraghazra/github-readme-stats"><img src="https://api-github-readme-stats.dfggmc.top/api?username=XiaoFeng-QWQ&amp;show_icons=true" alt="XiaoFeng-QWQ's github stats"></a>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </article>
                `;
                page1Element.html(html);
            }
        };
        // 调用异步函数
        fetchData();
    }
    if (page2Element.length > 0) {
        $.ajax({
            url: 'https://xiaofeng.now.cc/api/posts',
            dataType: 'JSON',
            success: function (data) {
                page2Element.html('');
                // 提取数据集
                let dataSet = data.data.dataSet;

                // 逐个生成 HTML 并添加到页面中
                $.each(dataSet, function (index, item) {
                    var postHtml = `
                    <div class="mdui-col-sm-12 mdui-col-md-6 item">
                        <div class="mdui-card box-shadow">
                            <div class="mdui-card-primary">
                                <h2 class="mdui-card-primary-title">${item.title}</h2>
                                <p class="digest mdui-card-primary-subtitle">${item.digest}</p>
                            </div>
                            <div class="mdui-card-actions">
                                <button class="mdui-btn mdui-float-right mdui-ripple mdui-btn-raised" onclick="window.open('${item.url}', '_blank')">阅读完整内容</button>
                            </div>
                            <div class="mdui-card-content">
                                <p>发布日期：${item.date.year}-${item.date.month}-${item.date.day}</p>
                            </div>
                        </div>
                    </div>
                    `;
                    // 将生成的 HTML 添加到页面
                    var postHtml = $(postHtml);
                    page2Element.append(postHtml);
                    // 使用 jQuery 的延迟和添加类方法实现逐个添加动画效果
                    postHtml.hide().delay(index * 100).fadeIn(400).addClass('animate__animated animate__fadeInUp');
                });

                // 查看更多文章按钮，直接放在最外层的 HTML 结构外面
                const moreHtml = `
                    <button class="mdui-btn mdui-center mdui-ripple mdui-btn-raised" onclick="window.open('https://xiaofeng.now.cc/', '_blank')">查看更多文章</button>
                `;
                page2Element.append(moreHtml);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                page2Element.append(`获取文章列表失败:, ${textStatus}, ${errorThrown}`)
            }
        });
    }
}
showPageHtml();