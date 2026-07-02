import type { FSDir, FSNode, GithubProfile } from '../types';

/**
 * 创建根目录文件系统结构
 * 模拟 Windows 系统的完整目录结构
 * @param githubProfile GitHub 用户资料
 * @returns 根目录节点
 */
export const createRootDir = (githubProfile: GithubProfile): FSDir => {
    return {
        type: 'dir',
        name: 'C:',
        lastWriteTime: '2025/01/20 12:00',
        children: {
            'Windows': {
                type: 'dir',
                name: 'Windows',
                lastWriteTime: '2024/12/15 10:30',
                children: {
                    'System32': {
                        type: 'dir',
                        name: 'System32',
                        lastWriteTime: '2024/12/15 10:30',
                        children: {
                            'drivers': {
                                type: 'dir',
                                name: 'drivers',
                                lastWriteTime: '2024/12/15 10:30',
                                children: {}
                            },
                            'config': {
                                type: 'dir',
                                name: 'config',
                                lastWriteTime: '2024/12/15 10:30',
                                children: {}
                            }
                        }
                    },
                    'Temp': {
                        type: 'dir',
                        name: 'Temp',
                        lastWriteTime: '2025/01/20 08:15',
                        children: {}
                    }
                }
            },
            'Program Files': {
                type: 'dir',
                name: 'Program Files',
                lastWriteTime: '2025/01/10 14:20',
                children: {
                    'Microsoft Office': {
                        type: 'dir',
                        name: 'Microsoft Office',
                        lastWriteTime: '2024/11/05 09:00',
                        children: {}
                    },
                    'Google': {
                        type: 'dir',
                        name: 'Google',
                        lastWriteTime: '2024/12/20 16:30',
                        children: {
                            'Chrome': {
                                type: 'dir',
                                name: 'Chrome',
                                lastWriteTime: '2024/12/20 16:30',
                                children: {}
                            }
                        }
                    },
                    'Common Files': {
                        type: 'dir',
                        name: 'Common Files',
                        lastWriteTime: '2024/10/01 12:00',
                        children: {}
                    }
                }
            },
            'Program Files (x86)': {
                type: 'dir',
                name: 'Program Files (x86)',
                lastWriteTime: '2025/01/10 14:20',
                children: {
                    'Steam': {
                        type: 'dir',
                        name: 'Steam',
                        lastWriteTime: '2024/08/15 20:00',
                        children: {}
                    },
                    'Microsoft': {
                        type: 'dir',
                        name: 'Microsoft',
                        lastWriteTime: '2024/10/01 12:00',
                        children: {}
                    }
                }
            },
            'ProgramData': {
                type: 'dir',
                name: 'ProgramData',
                lastWriteTime: '2024/06/15 08:00',
                children: {
                    'Microsoft': {
                        type: 'dir',
                        name: 'Microsoft',
                        lastWriteTime: '2024/06/15 08:00',
                        children: {}
                    }
                }
            },
            'Users': {
                type: 'dir',
                name: 'Users',
                lastWriteTime: '2024/05/20 10:00',
                children: {
                    'Public': {
                        type: 'dir',
                        name: 'Public',
                        lastWriteTime: '2024/05/20 10:00',
                        children: {
                            'Desktop': {
                                type: 'dir',
                                name: 'Desktop',
                                lastWriteTime: '2024/05/20 10:00',
                                children: {}
                            },
                            'Documents': {
                                type: 'dir',
                                name: 'Documents',
                                lastWriteTime: '2024/05/20 10:00',
                                children: {}
                            },
                            'Downloads': {
                                type: 'dir',
                                name: 'Downloads',
                                lastWriteTime: '2024/05/20 10:00',
                                children: {}
                            },
                            'Pictures': {
                                type: 'dir',
                                name: 'Pictures',
                                lastWriteTime: '2024/05/20 10:00',
                                children: {}
                            },
                            'Music': {
                                type: 'dir',
                                name: 'Music',
                                lastWriteTime: '2024/05/20 10:00',
                                children: {}
                            },
                            'Videos': {
                                type: 'dir',
                                name: 'Videos',
                                lastWriteTime: '2024/05/20 10:00',
                                children: {}
                            }
                        }
                    },
                    'XiaoFeng_QWQ': {
                        type: 'dir',
                        name: 'XiaoFeng_QWQ',
                        lastWriteTime: '2025/01/20 12:00',
                        children: {
                            'Desktop': {
                                type: 'dir',
                                name: 'Desktop',
                                lastWriteTime: '2025/01/20 12:00',
                                children: {
                                    'README.txt': {
                                        type: 'file',
                                        name: 'README.txt',
                                        lastWriteTime: '2025/01/20 12:00',
                                        content: 'Welcome to XiaoFeng_QWQ\'s Desktop!\n\nThis is a simulated Windows terminal environment.\nFeel free to explore the file system.'
                                    }
                                }
                            },
                            'Documents': {
                                type: 'dir',
                                name: 'Documents',
                                lastWriteTime: '2025/01/20 12:00',
                                children: {
                                    'skills.txt': {
                                        type: 'file',
                                        name: 'skills.txt',
                                        lastWriteTime: '2025/01/20 12:00',
                                        content: `Frontend     : React, Next.js, TypeScript, Tailwind CSS, Vite\nBackend      : Node.js, PHP, MySQL, Git Version Control`
                                    },
                                    'projects.txt': {
                                        type: 'file',
                                        name: 'projects.txt',
                                        lastWriteTime: '2025/01/20 12:00',
                                        content: () => `GitHub Profile: @XiaoFeng-QWQ\nPublic Repos  : ${githubProfile.publicRepos}\nFeel free to explore active projects dynamically under the "Projects" tab.`
                                    }
                                }
                            },
                            'Downloads': {
                                type: 'dir',
                                name: 'Downloads',
                                lastWriteTime: '2025/01/20 12:00',
                                children: {}
                            },
                            'Pictures': {
                                type: 'dir',
                                name: 'Pictures',
                                lastWriteTime: '2025/01/20 12:00',
                                children: {}
                            },
                            'Music': {
                                type: 'dir',
                                name: 'Music',
                                lastWriteTime: '2025/01/20 12:00',
                                children: {}
                            },
                            'Videos': {
                                type: 'dir',
                                name: 'Videos',
                                lastWriteTime: '2025/01/20 12:00',
                                children: {}
                            },
                            'AppData': {
                                type: 'dir',
                                name: 'AppData',
                                lastWriteTime: '2025/01/20 12:00',
                                children: {
                                    'Local': {
                                        type: 'dir',
                                        name: 'Local',
                                        lastWriteTime: '2025/01/20 12:00',
                                        children: {
                                            'Temp': {
                                                type: 'dir',
                                                name: 'Temp',
                                                lastWriteTime: '2025/01/20 08:15',
                                                children: {}
                                            },
                                            'Microsoft': {
                                                type: 'dir',
                                                name: 'Microsoft',
                                                lastWriteTime: '2024/12/15 10:30',
                                                children: {}
                                            }
                                        }
                                    },
                                    'Roaming': {
                                        type: 'dir',
                                        name: 'Roaming',
                                        lastWriteTime: '2025/01/20 12:00',
                                        children: {
                                            'Microsoft': {
                                                type: 'dir',
                                                name: 'Microsoft',
                                                lastWriteTime: '2024/12/15 10:30',
                                                children: {}
                                            }
                                        }
                                    }
                                }
                            },
                            'identity.txt': {
                                type: 'file',
                                name: 'identity.txt',
                                lastWriteTime: '2025/01/20 12:00',
                                content: () => `location     : Taipei, Taiwan\ndomain       : https://xiaofengqwq.com/\ngithub       : XiaoFeng-QWQ\nrepositories : ${githubProfile.publicRepos} public\nstatus       : Stay Focused.`
                            },
                            'about.txt': {
                                type: 'file',
                                name: 'about.txt',
                                lastWriteTime: '2025/01/20 12:00',
                                content: () => `XiaoFeng_QWQ - Full-Stack Developer & Designer.\nBio          : ${githubProfile.bio || 'Full-Stack Developer & Designer'}\nLocation     : ${githubProfile.location || 'Taipei, Taiwan'}`
                            }
                        }
                    }
                }
            },
            'PerfLogs': {
                type: 'dir',
                name: 'PerfLogs',
                lastWriteTime: '2024/06/15 08:00',
                children: {
                    'Admin': {
                        type: 'dir',
                        name: 'Admin',
                        lastWriteTime: '2024/06/15 08:00',
                        children: {}
                    }
                }
            },
            'Temp': {
                type: 'dir',
                name: 'Temp',
                lastWriteTime: '2025/01/20 08:15',
                children: {}
            },
            '$Recycle.Bin': {
                type: 'dir',
                name: '$Recycle.Bin',
                lastWriteTime: '2024/05/20 10:00',
                children: {}
            },
            'System Volume Information': {
                type: 'dir',
                name: 'System Volume Information',
                lastWriteTime: '2024/05/20 10:00',
                children: {}
            }
        }
    };
};

/**
 * 路径解析寻址器
 * @param pathSegments 路径段数组
 * @param rootDir 根目录节点
 * @returns 找到的节点或 null
 */
export const navigateTo = (pathSegments: string[], rootDir: FSDir): FSNode | null => {
    let current: FSNode = rootDir;
    for (const segment of pathSegments) {
        if (segment === 'C:') continue;
        if (current.type !== 'dir') return null;
        const next: FSNode | undefined = current.children[segment];
        if (!next) return null;
        current = next;
    }
    return current;
};