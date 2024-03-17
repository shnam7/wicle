/// <reference types="vitest" />
import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import packageJson from "./package.json"

const getPackageName = () => {
    return packageJson.name
}

const getPackageNameCamelCase = () => {
    try {
        return getPackageName().replace(/-./g, char => (char[1] as string).toUpperCase())
    } catch (err) {
        throw new Error("Name property in package.json is missing.")
    }
}

const fileName = {
    es: `${getPackageName()}.mjs`,
    cjs: `${getPackageName()}.cjs`,
    iife: `${getPackageName()}.iife.js`,
}

const formats = Object.keys(fileName) as Array<keyof typeof fileName>

export default defineConfig({
    plugins: [react()],
    base: "./",
    build: {
        outDir: "./build/dist",
        lib: {
            entry: path.resolve(__dirname, "src/index.ts"),
            name: getPackageNameCamelCase(),
            formats,
            fileName: format => fileName[format as keyof typeof fileName],
        },
    },
    // test: {},
    resolve: {
        alias: [
            { find: "@", replacement: path.resolve(__dirname, "src") },
            { find: "@@", replacement: path.resolve(__dirname) },
        ],
    },
})