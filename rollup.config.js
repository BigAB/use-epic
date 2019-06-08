import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import pkg from './package.json';

export default [
  {
    input: 'src/main.js',
    external: ['react', 'rxjs', 'rxjs/operators'],
    output: [
      { file: pkg.module, format: 'es' },
      { file: pkg.main, format: 'cjs', exports: 'named' },
    ],
    plugins: [
      resolve({
        mainFields: ['module', 'main', 'browser'],
        dedupe: ['react', 'rxjs'],
      }),
      babel({
        exclude: 'node_modules/**',
        presets: [
          ['@babel/preset-env', { targets: { chrome: 76 } }],
          '@babel/preset-react',
        ],
      }),
    ],
  },
  // browser-friendly UMD build
  {
    input: 'src/main.js',
    output: {
      name: 'useEpic',
      file: pkg.browser,
      format: 'umd',
      globals: {
        react: 'React',
        rxjs: 'rxjs',
        'rxjs/operators': 'rxjs.operators',
      },
      exports: 'named',
    },
    plugins: [
      resolve({
        mainFields: ['module', 'main', 'browser'],
        dedupe: ['react', 'rxjs'],
      }),
      babel({
        exclude: 'node_modules/**',
        presets: [
          ['@babel/preset-env', { targets: { chrome: 76 } }],
          '@babel/preset-react',
        ],
      }),
      commonjs(),
    ],
    external: ['react', 'rxjs', 'rxjs/operators'],
  },
];
