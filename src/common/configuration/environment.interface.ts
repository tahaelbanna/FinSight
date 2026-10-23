export interface EnvironmentInterface {
    port: number;
    fallbackLanguage: string;
    database: IDB;
}
export interface IDB {
    host: string;
    db_port: number;
    username: string;
    password: string;
    name: string;
}