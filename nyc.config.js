module.exports = {
  all: false,
  include: ['src/**'],
  exclude: ['**/*.spec.ts', 'src/service/**/*.spec.ts'],
  reporter: [require.resolve('@cexoso/git-diff-report')],
  // reporter: ['html'],
}
