/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("fs").promises;
const path = require("path");

const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);

const files = [
  {
    name: "constant.ts",
    getCode: folderName =>
      `
import { Prisma } from "@prisma/client";
const ${capitalize(folderName)}s = Prisma.${capitalize(folderName)}ScalarFieldEnum;
export const ${capitalize(folderName)}s_SEARCHABLE_FIELDS: Prisma.${capitalize(folderName)}ScalarFieldEnum[] = [
  ${capitalize(folderName)}s.title,
  ${capitalize(folderName)}s.slug,
];
export const ${capitalize(folderName)}_FILTERABLE_FIELDS = [
  "searchTerm",
  "fields",
  // "include", // temporally removed security reason
  "createdAtFrom",
  "createdAtTo",
  "is_deleted",

  "status",
  //
  "user_id",

  //
];



      
`,
  },
  {
    name: "controller.ts",
    getCode: folderName =>
      `
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Request, Response } from "express";
import httpStatus from "http-status";
import { ${capitalize(folderName)}AfterAction } from "./utls.${capitalize(folderName)}";
import { ENUM_REDIS_KEY } from "../../redis/consent.redis";
import {
  RedisAllQueryServiceOop,
  RedisAllSetterServiceOop,
} from "../../redis/service.redis";
import { ReqToCacheKeyGenerator } from "../../redis/utls.redis";
import { AbstractController } from "../../share/Abstractor/AbstractController";
import { logger } from "../../share/logger";
import { IUserRefAndDetails } from "../allUser/typesAndConst";
import { ${capitalize(folderName)}_FILTERABLE_FIELDS } from "./constant.${capitalize(folderName)}";
import { I${capitalize(folderName)} } from "./interface.${capitalize(folderName)}";
import { ${capitalize(folderName)}ServiceClass } from "./service.${capitalize(folderName)}";

export class ${capitalize(folderName)}ControllerClass extends AbstractController {
  public service = new ${capitalize(folderName)}ServiceClass();
  constructor() {
    super();
  }

  create${capitalize(folderName)} = this.catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUserRefAndDetails;
    const payload = { ...req.body };
    const result = await this.service.create${capitalize(folderName)}ByDb(
      payload,
      req.user as IUserRefAndDetails,
    );
     this.sendResponse<I${capitalize(folderName)} | null>(res,  {
      success: true,
      statusCode: httpStatus.OK,
      message: "successful create ${capitalize(folderName)}",
      data: result,
    });
    await new ${capitalize(folderName)}AfterAction().afterAction("CREATE", { payload, user });
    return;
  });

  getAll${capitalize(folderName)} = this.catchAsync(async (req: Request, res: Response) => {
    type Result = {
      data: I${capitalize(folderName)}[];
      meta: { total: number; page: number; limit: number };
    };
    const reqKey = new ReqToCacheKeyGenerator(req).generateKey();
    const key = "{ENUM_REDIS_KEY.RIS_All_${capitalize(folderName)}}{reqKey}"; // consider prefix versioning, e.g., :v1

    const getter = new RedisAllQueryServiceOop();
    let result = (await getter.getAnyDataByKey(key)) as Result | null;
    if (result) {
      return this.sendResponse<I${capitalize(folderName)}[]>(res,  {
        success: true,
        statusCode: httpStatus.OK,
        message: "successfully Get all ${capitalize(folderName)}",
        meta: result.meta,
        data: result.data,
      });
    }
    // Cache miss → query DBs
    const filters = this.pick(req.query, ${capitalize(folderName)}_FILTERABLE_FIELDS);
    const paginationOptions = this.pick(req.query, this.PAGINATION_FIELDS);

    result = await this.service.getAll${capitalize(folderName)}FromDb(
      filters,
      paginationOptions,
      req.user as IUserRefAndDetails,
    );

    this.sendResponse<I${capitalize(folderName)}[]>(res,  {
      success: true,
      statusCode: httpStatus.OK,
      message: "successfully Get all ${capitalize(folderName)}",
      meta: result.meta,
      data: result.data,
    });
    // Set cache in the background (don’t block the request)
    (async () => {
      try {
        const setter = new RedisAllSetterServiceOop();
        const ttl = (result.data?.length ?? 0) > 0 ? 1 * 60 * 60 : 10 * 60; // negative cache optional
        await setter.redisSetter([{ key, value: result, ttl }]);
      } catch (e) {
        // swallow/log: cache should never break the request path
        logger.warn("redisSetter failed", e);
      }
    })();

    return;
  });

  getSingle${capitalize(folderName)} = this.catchAsync(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const reqKey = new ReqToCacheKeyGenerator(req).generateKey();
      const key = "{ENUM_REDIS_KEY.RIS_All_${capitalize(folderName)}}{reqKey}"; // consider prefix versioning, e.g., :v1

      const getter = new RedisAllQueryServiceOop();
      let result = (await getter.getAnyDataByKey(
        key,
      )) as I${capitalize(folderName)} | null;
      if (result) {
        return this.sendResponse<I${capitalize(folderName)}>(res,  {
          success: true,
          statusCode: httpStatus.OK,
          message: "successfully get ${capitalize(folderName)}",
          data: result,
        });
      }
      const filters = this.pick(
        req.query,
        ${capitalize(folderName)}_FILTERABLE_FIELDS,
      );

      result = await this.service.getSingle${capitalize(folderName)}FromDb(
        id,
        filters,
        req.user as IUserRefAndDetails,
      );
      this.sendResponse<I${capitalize(folderName)} | null>(res,  {
        success: true,
        statusCode: httpStatus.OK,
        message: "successfully get ${capitalize(folderName)}",
        data: result,
      });
      // Set cache in the background (don’t block the request)
      (async () => {
        try {
          const setter = new RedisAllSetterServiceOop();
          const ttl = result?.id ? 3600 : 60;
          await setter.redisSetter([{ key, value: result, ttl }]);
        } catch (e) {
          // swallow/log: cache should never break the request path
          logger.warn("redisSetter failed", e);
        }
      })();
    },
  );
  update${capitalize(folderName)} = this.catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = { ...req.body };
       const user = req.user as IUserRefAndDetails;
    const result = await this.service.update${capitalize(folderName)}FromDb(
      id,
      updateData,
      user,
    );
await new ${capitalize(folderName)}AfterAction().afterAction("UPDATE", {
      id: id,
      payload: updateData,
      result: result,
      user,
    });
     this.sendResponse<I${capitalize(folderName)} | null>(res,  {
      success: true,
      statusCode: httpStatus.OK,
      message: "successfully update ${capitalize(folderName)}",
      data: result,
    });
    
    return;
  });

  delete${capitalize(folderName)} = this.catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
      const user = req.user as IUserRefAndDetails;
    const result = await this.service.delete${capitalize(folderName)}ByIdFromDb(
      id,
      req.query,
      req.user as IUserRefAndDetails,
    );
    await new ${capitalize(folderName)}AfterAction().afterAction("DELETE", {
      result: result,
      user,
      id: id,
    });
     this.sendResponse<I${capitalize(folderName)} | null>(res,  {
      success: true,
      statusCode: httpStatus.OK,
      message: "successfully delete ${capitalize(folderName)}",
      data: result,
    });
    
    return;
  });
}


`,
  },

  {
    name: "interface.ts",
    getCode: folderName =>
      `
import { PrismaEnum } from "../../share/Prisma/inteface.prisma";
import { ${capitalize(folderName)} } from "@prisma/client";
export type I${capitalize(folderName)}Filters = {
  searchTerm?: string;
  fields?: string;
  include?: string;

  is_deleted?: string | boolean;
  createdAtFrom?: string;
  createdAtTo?: string;
  //
  status?: keyof typeof PrismaEnum.AllTableStatus;

};

export type I${capitalize(folderName)} = ${capitalize(folderName)};

      
`,
  },
  {
    name: "model.ts",
    getCode: folderName =>
      `
      //
     
      
`,
  },
  {
    name: "middlewares.ts",
    getCode: folderName =>
      `

// import { createPrismaMiddleware } from "../../middlewares/prismaMiddleware";
// import { ENUM_QUEUE_NAME } from "../../queue/consent.queus";
// import {
//   IRedisCacheRemoveQueues,
//   redisCacheRemoveQueue,
// } from "../../queue/jobs/redisCacheRemoveQueues";
// import { ENUM_REDIS_KEY } from "../../redis/consent.redis";
// import { PrismaActionArgsMap } from "../../share/Prisma/inteface.prisma";
// import { MiddlewareParams } from "../../share/Prisma/middleware-compat";
// import { I${capitalize(folderName)} } from "./interface.${capitalize(folderName)}";
// type ${capitalize(folderName)}Args = PrismaActionArgsMap<I${capitalize(folderName)}>;
// export const ${capitalize(folderName)}PrismaMiddleware = createPrismaMiddleware({
//   before: async (params: MiddlewareParams) => {
//     if (params.model === "${capitalize(folderName)}") {
//       if (params.action === "create") {
//         // console.log("before create Module with data:", params.args.data);
//       } else if (params.action === "update") {
//         // console.log("⚙️ before Updating Module with data:", params.args.data);
//       }
//     }
//   },

//   after: async (params: MiddlewareParams, result: unknown) => {
//     if (params.model === "${capitalize(folderName)}") {
//       const rootKey = "{ENUM_REDIS_KEY.RIS_All_${capitalize(folderName)}}*";
//       switch (params.action) {
//         case "create": {
//           const { data } = params.args as ${capitalize(folderName)}Args["create"];

//           await redisCacheRemoveQueue.add(
//             ENUM_QUEUE_NAME.redisCacheRemoveCache,
//             {
//               // ids: [key],
//               patternKeys: [rootKey],
//             } as IRedisCacheRemoveQueues,
//           );
//           break;
//         }

//         case "createManyAndReturn": {
//           const { data } = params.args as ${capitalize(folderName)}Args["createMany"];

//           await redisCacheRemoveQueue.add(
//             ENUM_QUEUE_NAME.redisCacheRemoveCache,
//             {
//               // ids: [key],
//               patternKeys: [rootKey],
//             } as IRedisCacheRemoveQueues,
//           );
//           break;
//         }
//         case "createMany": {
//           const { data } = params.args as ${capitalize(folderName)}Args["createMany"];

//           await redisCacheRemoveQueue.add(
//             ENUM_QUEUE_NAME.redisCacheRemoveCache,
//             {
//               // ids: [key],
//               patternKeys: [rootKey],
//             } as IRedisCacheRemoveQueues,
//           );
//           break;
//         }

//         case "update": {
//           const { data } = params.args as ${capitalize(folderName)}Args["update"];

//           await redisCacheRemoveQueue.add(
//             ENUM_QUEUE_NAME.redisCacheRemoveCache,
//             {
//               // ids: [key],
//               patternKeys: [rootKey],
//             } as IRedisCacheRemoveQueues,
//           );

//           break;
//         }

//         case "updateMany": {
//           const { where } = params.args as ${capitalize(folderName)}Args["updateMany"];

//           await redisCacheRemoveQueue.add(
//             ENUM_QUEUE_NAME.redisCacheRemoveCache,
//             {
//               // ids: [key],
//               patternKeys: [rootKey],
//             } as IRedisCacheRemoveQueues,
//           );

//           break;
//         }

//         case "delete": {
//           const { where } = params.args as ${capitalize(folderName)}Args["delete"];

//           await redisCacheRemoveQueue.add(
//             ENUM_QUEUE_NAME.redisCacheRemoveCache,
//             {
//               // ids: [key],
//               patternKeys: [rootKey],
//             } as IRedisCacheRemoveQueues,
//           );
//           break;
//         }

//         case "deleteMany": {
//           const { where } = params.args as PrismaActionArgsMap["deleteMany"];

//           await redisCacheRemoveQueue.add(
//             ENUM_QUEUE_NAME.redisCacheRemoveCache,
//             {
//               // ids: [key],
//               patternKeys: [rootKey],
//             } as IRedisCacheRemoveQueues,
//           );

//           break;
//         }
//       }
//     }

//     return result;
//   },
// });





`,
  },

  {
    name: "route.ts",
    getCode: folderName =>
      `
import express from "express";
import { USER_ROLE } from "../../../global/enums/users";
import { AbstractRoute } from "../../share/Abstractor/AbstractRoute";
import { ${capitalize(folderName)}ControllerClass } from "./controller.${capitalize(folderName)}";
import { ${capitalize(folderName)}ValidationClass } from "./validation.${capitalize(folderName)}";

export class ${capitalize(folderName)}RouteClass extends AbstractRoute {
  private controller = new ${capitalize(folderName)}ControllerClass();
  private validator = new ${capitalize(folderName)}ValidationClass();
  constructor() {
    super();
    // if you make a new initial route entry methord then call / optional
    this.router
      .route("/")
      // This route is open
      .get(
        this.authMiddleware(
          this.USER_ROLE.ADMIN,
           
          
           
        ),
        this.validateRequestZod(this.validator.${capitalize(folderName)}QueryParamZodSchema),
        this.controller.getAll${capitalize(folderName)},
      )
      .post(
        this.authMiddleware(
          this.USER_ROLE.ADMIN,
           
            
           
        ),
     
        this.validateRequestZod(this.validator.create${capitalize(folderName)}ZodSchema),
        this.controller.create${capitalize(folderName)},
      );

    this.router
      .route("/:id")
      // This route is open
      .get(
        this.authMiddleware(
          this.USER_ROLE.ADMIN,
          
           
           
        ),
        this.validateRequestZod(this.validator.${capitalize(folderName)}QueryParamZodSchema),
        this.controller.getSingle${capitalize(folderName)},
      )
      .patch(
        this.authMiddleware(
          this.USER_ROLE.ADMIN,
           
            
           
        ),
     
        this.validateRequestZod(this.validator.update${capitalize(folderName)}ZodSchema),
        this.controller.update${capitalize(folderName)},
      )
      .delete(
        this.authMiddleware(
          this.USER_ROLE.ADMIN,
          this. 
          
        ),

        this.controller.delete${capitalize(folderName)},
      );
  }
}



`,
  },
  {
    name: "service.ts",
    getCode: folderName =>
      `
    /* eslint-disable @typescript-eslint/no-unused-vars */
import { IGenericResponse } from "../../interface/common";
import { IPaginationOption } from "../../interface/pagination";
import { Prisma, PrismaEnum } from "../../share/Prisma/inteface.prisma";
import httpStatus from "http-status";
import z from "zod";
import { createSearchBuilder } from "../../../helper/searchBuilerDb";
import ApiError from "../../errors/ApiError";
import { AbstractService } from "../../share/Abstractor/AbstractService";

import { IUserRefAndDetails } from "../allUser/typesAndConst";
import { ${capitalize(folderName)}_SEARCHABLE_FIELDS } from "./constant.${capitalize(folderName)}";
import { I${capitalize(folderName)}, I${capitalize(folderName)}Filters } from "./interface.${capitalize(folderName)}";
import {
  create${capitalize(folderName)}_BodyData,
  update${capitalize(folderName)}_BodyData,
} from "./validation.${capitalize(folderName)}";
import { USER_ROLE } from "../../../global/enums/users";
// ------------------------

export type I${capitalize(folderName)}CreatePayload = z.infer<
  typeof create${capitalize(folderName)}_BodyData
>;
type I${capitalize(folderName)}UpdatePayload = z.infer<typeof update${capitalize(folderName)}_BodyData>;
export class ${capitalize(folderName)}ServiceClass extends AbstractService {
  constructor() {
    super();
    // constructor
  }
  create${capitalize(folderName)}ByDb = async (
    payload: I${capitalize(folderName)}CreatePayload ,
    user: IUserRefAndDetails,
  ): Promise<I${capitalize(folderName)} | null> => {
    // const user = req.user as IUserRefAndDetails;
    //
    const { ...restPayload } = payload;

    const result = await this.prismaClient.${capitalize(folderName)}.create({
      data: {
        ...restPayload,
      },
    });

    return result;
  };
  createMany${capitalize(folderName)}ByDb = async (
    payload: Array<
      I${capitalize(folderName)}CreatePayload & {
        author_id: string;
      }
    >,
    user: IUserRefAndDetails,
  ): Promise<I${capitalize(folderName)}[] | null> => {
    // const user = req.user as IUserRefAndDetails;
    //
    const { ...restPayload } = payload;

    const result = await this.prismaClient.${capitalize(folderName)}.createManyAndReturn({
      data: {
        ...restPayload,
      },
    });

    return result;
  };

  //getAll${capitalize(folderName)}FromDb
  getAll${capitalize(folderName)}FromDb = async (
    filters: I${capitalize(folderName)}Filters,
    paginationOptions: IPaginationOption,
    user: IUserRefAndDetails,
  ): Promise<IGenericResponse<I${capitalize(folderName)}[]>> => {
    const {
      searchTerm,
      fields,
      include,
      createdAtFrom,
      createdAtTo,
      ...filtersData
    } = filters;

    filtersData.is_deleted = filtersData.is_deleted
      ? filtersData.is_deleted == "true"
        ? true
        : false
      : false;
   if (user?.user_type !== USER_ROLE.ADMIN) {
      filtersData.status = "active";
    }
    // Check if user is admin
    // if (user?.user_type !== USER_ROLE.ADMIN) {
    //   filtersData.author_id = user.userId;
    // }

    // Create Prisma where clause
    const whereConditions: Prisma.${capitalize(folderName)}WhereInput = {
      AND: [],
    };

    if (!Array.isArray(whereConditions.AND)) {
      whereConditions.AND = [];
    }

    // 1. SearchTerm with OR on searchable fields
    // if (searchTerm) {
    //   whereConditions.AND.push({
    //     OR: ${capitalize(folderName)}_SEARCHABLE_FIELDS.map(field => ({
    //       [field]: {
    //         contains: searchTerm,
    //         mode: "insensitive",
    //       },
    //     })),
    //   });
    // }
    if (searchTerm) {
      const { buildSearchWhere } = createSearchBuilder({
        relationKinds: {
          // admin: "one",
          // moderator: "one",
          // writer: "one",
          // posts: "many", ...
        },
        // caseInsensitive: true,
        // defaultRelationKind: "one",
      });
      if (searchTerm) {
        const searchWhere = buildSearchWhere(
          ${capitalize(folderName)}_SEARCHABLE_FIELDS,
          searchTerm,
        );
        if (searchWhere) whereConditions.AND.push(searchWhere);
      }
    }

    // 2. Add direct filters
    const filterEntries = Object.entries(filtersData);

    if (filterEntries.length) {
      const directFilters = filterEntries.map(
        //@ts-ignore
        ([field, value]: [keyof typeof filtersData, string]) => {
          let modifyFiled: Prisma.${capitalize(folderName)}WhereInput;
          if (field === "is_deleted") {
            // modifyFiled = value.includes(",")
            //   ? { [field]: { in: value.split(",") } }
            //   : { [field]: value };
            modifyFiled = { [field]: value == "true" ? true : false };
          }else if (field === "status") {
            modifyFiled = {
              [field]: value as keyof typeof PrismaEnum.AllTableStatus,
            };
          } else {
            modifyFiled = { [field]: value };
          }

          return modifyFiled;
        },
      );

      whereConditions.AND.push(...directFilters);
    }

    // 3. Date range filters
    if (createdAtFrom && !createdAtTo) {
      const from = new Date(createdAtFrom);
      const to = new Date(new Date(createdAtFrom).setHours(23, 59, 59, 999));
      whereConditions.AND.push({
        createdAt: {
          gte: from,
          lte: to,
        },
      });
    } else if (createdAtFrom && createdAtTo) {
      whereConditions.AND.push({
        createdAt: {
          gte: new Date(createdAtFrom),
          lte: new Date(createdAtTo),
        },
      });
    }
    const { page, limit, skip, sortBy, sortOrder } =
      this.calculatePagination(paginationOptions);

    const findOption: Prisma.${capitalize(folderName)}FindManyArgs = {
      where: whereConditions,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: skip,
      take: limit,
      // include: {
      //   admin: true,
      // },
      // select: select,
    };
  const allowedRelations: Prisma.${capitalize(folderName)}Include = {
     
    };
    findOption.include = allowedRelations;

    const [result, total] = await Promise.all([
      this.prismaClient.${capitalize(folderName)}.findMany(findOption),
      this.prismaClient.${capitalize(folderName)}.count({
        where: whereConditions,
      }),
    ]);

   
    return {
      meta: {
        page,
        limit,
        total,
      },
      data: result,
    };
  };

  // get single ${capitalize(folderName)} form db
  getSingle${capitalize(folderName)}FromDb = async (
    id: string,
    filters: I${capitalize(folderName)}Filters,
    user: IUserRefAndDetails,
  ): Promise<I${capitalize(folderName)} | null> => {
    const { searchTerm, fields, include, ...filtersData } = filters;
    const whereConditions: Prisma.${capitalize(folderName)}WhereInput = {
      id: id,
      is_deleted: false,
    };
    const findOption: Prisma.${capitalize(folderName)}FindFirstArgs = {
      where: whereConditions,
    };
    // const allowedRelations: Prisma.${capitalize(folderName)}Include = {
    //   author: true,
    // };
    if (include) {
      const parser = this.includeRelationParser(include);
      const includeObject = parser.parse();
      findOption.include = includeObject;
    } else if (!include && fields) {
      const parser = this.fieldSelectorParser(
        fields,
        //allowedRelations as AllowedRelations,
      );
      findOption.select = parser.parse();
    }
    const result = await this.prismaClient.${capitalize(folderName)}.findFirst(findOption);
    if (!result) {
      return null;
    }

    return result;
  };

  // update ${capitalize(folderName)}e form db
  update${capitalize(folderName)}FromDb = async (
    id: string,
    payload: Partial<I${capitalize(folderName)}UpdatePayload>,
    user: IUserRefAndDetails,
  ): Promise<I${capitalize(folderName)} | null> => {
    const isExist = await this.prismaClient.${capitalize(folderName)}.findFirst({
      where: { id: id, is_deleted: false },
    });
    if (!isExist) {
      throw new ApiError(httpStatus.NOT_FOUND, "${capitalize(folderName)} not found");
    }
    // if (
    //   isExist.author_id !== user.userId &&
    //   user?.user_type !== USER_ROLE.ADMIN
    // ) {
    //   throw new ApiError(httpStatus.FORBIDDEN, "Not authorized to delete");
    // }

    // Now assign_by can still be cast
    const result = await this.prismaClient.${capitalize(folderName)}.update({
      where: { id: id },
      data: {
        ...payload,
      },
    });

    return result;
  };

  // delete ${capitalize(folderName)}e form db
  delete${capitalize(folderName)}ByIdFromDb = async (
    id: string,
    query: I${capitalize(folderName)}Filters,
    user: IUserRefAndDetails,
  ): Promise<I${capitalize(folderName)} | null> => {
    const isExist = await this.prismaClient.${capitalize(folderName)}.findFirst({
      where: { id: id, is_deleted: false },
    });
    if (!isExist) {
      throw new ApiError(httpStatus.NOT_FOUND, "${capitalize(folderName)} not found");
    }
    // if (
    //   isExist.author_id !== user.userId &&
    //   user?.user_type !== USER_ROLE.ADMIN
    // ) {
    //   throw new ApiError(httpStatus.FORBIDDEN, "Not authorized to delete");
    // }

    const result = await this.prismaClient.${capitalize(folderName)}.update({
      where: { id: id },
      data: {
        is_deleted: true,
        deletedAt: new Date(),
      },
    });
    return result;
  };
  //
}




`,
  },

  {
    name: "utls.ts",
    getCode: folderName =>
      `

import { EventEmitter } from "events";
import { ENUM_QUEUE_NAME } from "../../queue/consent.queus";
import {
  IRedisCacheRemoveQueues,
  redisCacheRemoveQueue,
} from "../../queue/jobs/redisCacheRemoveQueues";
import { ENUM_REDIS_KEY } from "../../redis/consent.redis";
import { PrismaClientSingleton } from "../../share/Prisma/prisma";
import { IUserRefAndDetails } from "../allUser/typesAndConst";
import { I${capitalize(folderName)} } from "./interface.${capitalize(folderName)}";
// Define supported actions
export type ActionType = "GET" | "GET_ALL" | "CREATE" | "UPDATE" | "DELETE";

// Common payload interface
type AfterActionParams = {
  singleData?: I${capitalize(folderName)};
  allData?: I${capitalize(folderName)}[];
  payload?: I${capitalize(folderName)} | any;
  result?: any;
  id?: string;
  user?: IUserRefAndDetails;
};

// Base Handler Interface
type IActionHandler = {
  handle(params: AfterActionParams): Promise<void>;
};
const rootKey = "{ENUM_REDIS_KEY.RIS_All_${capitalize(folderName)}}*";
// ---------------- Handlers ----------------
class GetHandler implements IActionHandler {
  async handle({ singleData }: AfterActionParams) {
    //remove-on-prod
    console.log("After GET:", singleData?.id);
    // Example: analytics logging
  }
}

class GetAllHandler implements IActionHandler {
  async handle({ allData }: AfterActionParams) {
    //remove-on-prod
    console.log("After GET_ALL, count:", allData?.length);
  }
}

class CreateHandler implements IActionHandler {
  async handle({ payload, user }: AfterActionParams) {
    //remove-on-prod
    console.log("After CREATE by:", user?.userId, "Payload:", payload);
    // Example: send notification / publish event
    await redisCacheRemoveQueue.add(ENUM_QUEUE_NAME.redisCacheRemoveCache, {
      // ids: [key],
      patternKeys: [rootKey],
    } as IRedisCacheRemoveQueues);
  }
}

class UpdateHandler implements IActionHandler {
  async handle({ payload, result, id }: AfterActionParams) {
    //remove-on-prod
    console.log("After UPDATE:", payload?.id);
    await redisCacheRemoveQueue.add(ENUM_QUEUE_NAME.redisCacheRemoveCache, {
      // ids: [key],
      patternKeys: [rootKey],
    } as IRedisCacheRemoveQueues);
  }
}

class DeleteHandler implements IActionHandler {
  async handle({ id, result }: AfterActionParams) {
    //remove-on-prod
    console.log("After DELETE:", id);
    // Example: remove from cache
    await redisCacheRemoveQueue.add(ENUM_QUEUE_NAME.redisCacheRemoveCache, {
      // ids: [key],
      patternKeys: [rootKey],
    } as IRedisCacheRemoveQueues);
  }
}

// ---------------- Main Class ----------------
export class ${capitalize(folderName)}AfterAction {
  private prismaClient = PrismaClientSingleton.getInstance();
  private eventEmitter = new EventEmitter();

  private handlers: Record<ActionType, IActionHandler> = {
    GET: new GetHandler(),
    GET_ALL: new GetAllHandler(),
    CREATE: new CreateHandler(),
    UPDATE: new UpdateHandler(),
    DELETE: new DeleteHandler(),
  };

  constructor() {
    // Attach handlers automatically
    (Object.keys(this.handlers) as ActionType[]).forEach(action => {
      this.eventEmitter.on(action, async (params: AfterActionParams) => {
        await this.handlers[action].handle(params);
      });
    });
  }

  async afterAction(action: ActionType, params: AfterActionParams) {
    this.eventEmitter.emit(action, params);
  }
}




`,
  },
  {
    name: "validation.ts",
    getCode: folderName =>
      `
 import { z } from "zod";
import { BasicRequestQueryParams } from "../../../global/schema/global.schema";
import { PrismaEnum } from "../../share/Prisma/inteface.prisma";
import { ${capitalize(folderName)}_FILTERABLE_FIELDS } from "./constant.${capitalize(folderName)}";

export const create${capitalize(folderName)}_BodyData = z
  .object({
    blog_id: z.string(),
    parent_comment_id: z.string().optional(),
    comment: z.string().max(2000),
  })
  .strict();

export const update${capitalize(folderName)}_BodyData = create${capitalize(folderName)}_BodyData
  .pick({
    comment: true,
  })
  .merge(
    z.object({
      // is_deleted: z.boolean().optional(),
      status: z.nativeEnum(PrismaEnum.AllTableStatus).optional(),
      //
    }),
  );

const ${capitalize(folderName)}QueryParam = z
  .object(
    ${capitalize(folderName)}_FILTERABLE_FIELDS.reduce<Record<string, z.ZodTypeAny>>(
      (acc, k) => {
        acc[k] = z.string().optional();
        return acc;
      },
      {},
    ),
  )
  .merge(BasicRequestQueryParams)
  .strict();
export class ${capitalize(folderName)}ValidationClass {
  public readonly create${capitalize(folderName)}ZodSchema = z.object({
    body: create${capitalize(folderName)}_BodyData,
  });

  public readonly update${capitalize(folderName)}ZodSchema = z.object({
    body: update${capitalize(folderName)}_BodyData.partial(),
  });

  public readonly ${capitalize(folderName)}QueryParamZodSchema = z.object({
    query: ${capitalize(folderName)}QueryParam,
  });
  constructor() {
    // constructor
  }
}


`,
  },
];

async function createFolderAndFiles(parentDirectory, folderName) {
  try {
    const moduleDirectory = path.join(parentDirectory, folderName);
    // Create the folder
    await fs.mkdir(moduleDirectory);
    // Create the files using for...of loop and async/await
    for (const file of files) {
      const parts = file.name.split(".");
      //after pop() then return pop file
      const fileExtinctionsName = `${parts.pop()}`; //ts
      const fileName = parts.join("."); //interface.favoriteProduct
      const filePath = path.join(
        moduleDirectory,
        `${fileName}.${capitalize(folderName)}.${fileExtinctionsName}`,
      );
      await fs.writeFile(filePath, file.getCode(folderName));
      console.log(`Created ${filePath}`);
    }

    console.log("Module and files created successfully.");
  } catch (error) {
    console.error("Error:", error);
  }
}

async function getUserInput() {
  return new Promise(resolve => {
    const readline = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    readline.question(
      'Enter the Module name (or "exit" to terminate): ',
      folderName => {
        readline.close();
        resolve(folderName);
      },
    );
  });
}

async function start() {
  const parentDirectory = "src/app/modules";

  while (true) {
    const folderName = await getUserInput();
    if (folderName.toLowerCase() === "exit") {
      process.exit(0);
    }
    await createFolderAndFiles(parentDirectory, folderName);
  }
}

start();
