const { template } = require('@babel/core');
const buildImportMeta = template.expression("require('url').pathToFileURL(module.filename).href");

module.exports = {
  parserOpts: {
    plugins: ['importMeta']
  },
  plugins: [
    function customImportMetaPlugin() {
      return {
        visitor: {
          MemberExpression(path) {
            if (
              path.node.object &&
              path.node.object.type === 'MetaProperty' &&
              path.node.object.meta &&
              path.node.object.meta.name === 'import' &&
              path.node.property &&
              (path.node.property.name === 'url' || path.node.property.value === 'url')
            ) {
              path.replaceWith(buildImportMeta());
            }
          }
        }
      };
    }
  ],
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }]
  ]
};
