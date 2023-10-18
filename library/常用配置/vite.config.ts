import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig } from "vite"


const fs = require("fs")
const path = require("path")

// Dotenv 是一个零依赖的模块，它能将环境变量中的变量从 .env 文件加载到 process.env 中
const dotenv = require("dotenv")

const envFiles = [
    /** default file */ `.env`,
    /** mode file */ `.env.${process.env.NODE_ENV}`
]

for (const file of envFiles) {
    const envConfig = dotenv.parse(fs.readFileSync(file))
    for (const k in envConfig) {
        process.env[k] = envConfig[k]
    }
}

export default defineConfig({
    define: {
        'process.env': process.env
    },
    // 开发或生产环境服务的公共基础路径
    base: './',
    // 作为静态资源服务的文件夹
    publicDir: 'assets',
    plugins: [vue(), vueJsx()],
    resolve: {
        // 文件系统路径的别名
        alias: {
            '@': path.resolve(__dirname, 'src'),
            'vue': 'vue/dist/vue.esm-bundler.js',
            'vue-i18n': 'vue-i18n/dist/vue-i18n.cjs.js'
        }
    },
    css: {
        preprocessorOptions: {
            scss: {
                additionalData: '@import "./src/assets/style/index.scss";'
            }
        }
    },
    build: {
        // 压缩
        minify: process.env.VITE_NODE_ENV === 'production' ? 'esbuild' : false,
        // 服务端渲染
        ssr: false,
        outDir: 'dist',
        chunkSizeWarningLimit: 2000,
        emptyOutDir: true,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        return id.toString().split('node_modules/')[1].split('/')[0].toString()
                    }
                }
            }
        }
    },
    server: {
        host: process.env.VITE_HOST,
        port: +process.env.VITE_PORT,
        // 是否自动在浏览器打开
        open: false,
        hmr: true,
        proxy: {
            '/api': {
                target: "http://127.0.0.1:99999",
                changeOrigin: true
            }
        }
    }
})


    // .env

// # loaded in all cases
VITE_HOST = '0.0.0.0'
VITE_PORT = 8080
VITE_BASE_URL = './'
VITE_OUTPUT_DIR = 'dist'


    .env.development



// # 开发环境
VITE_NODE_ENV = 'development'
VITE_API_DOMAIN = '/api'


    .env.production



// # 生产环境
VITE_NODE_ENV = 'production'
VITE_API_DOMAIN = 'production.xxx.xxx'


package.json



"scripts": {
    "dev": "NODE_ENV=development vite",
        "build-dev": "NODE_ENV=development vite build --mode development",
        "build-prd": "NODE_ENV=production vite build --mode production",
        "lint": "lint-staged ."
}
