module.exports = {
  all: false,
  include: ['src/**/*.ts'],
  'check-coverage': true,
  branches: 80,
  lines: 90,
  functions: 90,
  statements: 90,
  perFile: true,
  reporter: [require.resolve('@cexoso/git-diff-report')],
}
