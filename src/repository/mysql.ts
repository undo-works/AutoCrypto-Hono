import * as mysql from "mysql2/promise";

let connection: mysql.Connection | null = null;

export async function getConnection() {
  if (connection) return connection;

  connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USERNAME,
    database: process.env.MYSQL_DATABASE,
    password: process.env.MYSQL_PASSWORD,
  });

  return connection;
}

export async function closeConnection() {
  if (connection) {
    await connection.end();
    connection = null;
  }
}

/**
 * Execute a query
 * @param sql
 * @returns
 */
export async function query<T>(sql: string, values: any[]): Promise<T> {
  const conn = await getConnection();
  const [results] = await conn.query(sql, values);
  await closeConnection();
  return results as T;
}
