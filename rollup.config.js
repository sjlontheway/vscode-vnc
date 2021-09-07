import babel from 'rollup-plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';

export default {
  input: './src/vnc/vnc.js',
  output: {
    file: 'resources/js/vncplay.js',
    format: 'umd',       // 文件输出格式  
    name: 'VncDisplay', // 包全局变量名
    // sourcemap: true,
  },
  // external:['lodash','novnc-node'], //告诉rollup将其作为外部依赖
  // gloabal:{
  // 'jquery':'$' //告诉rollup 全局变量$即jquery
  // }
  plugins: [
    commonjs(),
    builtins(),
    globals(),
    resolve(),
    babel()
  ]
}