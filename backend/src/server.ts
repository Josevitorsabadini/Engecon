import 'dotenv/config'
import { buildApp } from './app'

const PORT = Number(process.env.PORT) || 3333
const HOST = process.env.HOST || '0.0.0.0'

buildApp()
  .then((app) => {
    app.listen({ port: PORT, host: HOST }, (err) => {
      if (err) {
        app.log.error(err)
        process.exit(1)
      }
    })
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
