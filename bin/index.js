#!/usr/bin/env node

const ytdl = require('ytdl-core')
const ffmpeg = require('fluent-ffmpeg')
const cliProgress = require('cli-progress')
const { program } = require('commander')
const chalk = require('chalk')
const packageJson = require('../package.json')

const b1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

let url = ''
program
  .name(packageJson.name)
  .version(packageJson.version)
  .description('An application for download youtube music')
  .arguments('<url>')
  .action((a) => url = a)
  .parse(process.arg)

if (!ytdl.validateURL(url)) {
  program.outputHelp((help) => {
    return chalk.red('\n  url argument is invalid\n') + help
  })

  process.exit(1)
}


ytdl.getInfo(url)
  .then(info => {
    const name = info.videoDetails.title
    const stream = ytdl.downloadFromInfo(info, { filter: 'audioonly', quality: 'highestaudio' })
    let start = true
    
    stream.on('progress', (chunk, _download, total) => {
      if (start) {
        b1.start(Math.ceil(total / chunk), 0)
        start = false
      }
    
      b1.increment()
    }).on('end', () => b1.stop())

    ffmpeg(stream)
      .audioBitrate(128)
      .save(`${process.cwd()}/${name}.mp3`)
  })
  .catch(e => console.log(e))