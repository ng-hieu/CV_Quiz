import "reflect-metadata"
import { DataSource } from "typeorm"

export const AppDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "123456",
    database: "quiz",
    synchronize: true,
    logging: false,
    // entities: ["entity/*.ts"],
    // entities: [__dirname + '/../**/*.entity.{js,ts}'],
    entities: [__dirname + '/entity/*.{js,ts}'],
    migrations: [],
    subscribers: [],
})
