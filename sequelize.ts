import { Sequelize, DataTypes, Model } from "sequelize";

const fail = (error: string): never => {
  throw new Error(error);
}

const SQL_FLAVOR: "sqlite" | "mysql" = process.env.SQL_FLAVOR as any;
export const sequelize =
  SQL_FLAVOR === "sqlite" ? new Sequelize({
    dialect: "sqlite",
    storage: process.env.SQLITE_DATABASE || "db.sqlite",
  })
  : SQL_FLAVOR === "mysql" ? new Sequelize({
    dialect: "mysql",
    host: process.env.MYSQL_HOST || "localhost",
    port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
    username: process.env.MYSQL_USER || fail("No env MySQL_USER provided"),
    password: process.env.MYSQL_PASSWORD || fail("No env MYSQL_PASSWORD provided"),
    database: process.env.MYSQL_DATABASE || fail("No env MYSQL_DATABASE provided"),
  })
  : fail("No valid env SQL_FLAVOR found");

/** Attributes all models will have */
interface BaseAttributes {
  id: number;
}

/** Builds Creation Attributes */
type Creation<Res extends BaseAttributes> = Omit<Res, keyof BaseAttributes>;

// Resources
interface ResourceAttributes extends BaseAttributes {
  subject: string; // The subject, e.g. "TypeScript", "C#", etc
  topic: string; // The topic, e.g. "General", "Interfaces", "Classes", etc
  description: string; // Short description of what the resource explains
  link: string; // URL to the resource
  addedBy: string; // Discord ID, will be resolved to a user when needed
  approved: boolean; // Whether the resource has been approved by a moderator and can be shown to users
  approver: string | null; // Discord ID of the user who approved the resource
}

export class Resource extends Model<ResourceAttributes, Creation<ResourceAttributes> > {
  public id!: number;
  public subject!: string;
  public topic!: string;
  public description!: string;
  public link!: string;
  public addedBy!: string;
  public approved!: boolean;
  public approver!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Resource.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  topic: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  link: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  addedBy: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  approved: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  approver: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  sequelize,
});



sequelize.sync().then(() => {
  console.log("Database synced");
});