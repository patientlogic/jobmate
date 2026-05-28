import { ensureDatabaseUrl } from "../../config/database-url.js";
import { PrismaClient } from "@prisma/client";

ensureDatabaseUrl();

const prismaClientSingleton = () => {
  return new PrismaClient();
  //   {
  //   log: ["query"],
  // }
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
