import path from 'node:path';

/**
 * 项目根路径
 */
export const ROOT_PATH = path.join(__dirname, '../');

/**
 * 生成代码目录
 */
export const DIST_PATH = path.join(ROOT_PATH, '../dist');

/**
 * electron 依赖模块
 */
export const ELECTRON_DEPENDENCIES: string[] = [];
