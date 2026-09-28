export interface QueryResult {
  rowsAffected: number;
  lastInsertId?: number;
}

export interface SqlStatement {
  query: string;
  bindValues?: unknown[];
}

export interface IDatabase {
  executeBatch?(statements: SqlStatement[]): Promise<void>;
  execute(query: string, bindValues?: unknown[]): Promise<QueryResult>;
  select<T>(query: string, bindValues?: unknown[]): Promise<T>;
  close(db?: string): Promise<boolean>;
}

export interface SchemaMetadataRow {
  key: string;
  value: string;
  updated_at: string;
}

export interface AppSettingRow {
  key: string;
  value: string;
  updated_at: string;
}

export interface ProfileRow {
  id: string;
  name: string;
  uid: string | null;
  server: string | null;
  adventure_rank: number | null;
  world_level: number | null;
  traveler_gender: string | null;
  avatar_character_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  last_opened_at: string | null;
}
