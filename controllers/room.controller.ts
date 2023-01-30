import { RoomSchema, CreateRoomSchema } from "../schemas";
import { DI } from "../db";
import { protectedProcedure, router } from "../trpc";
import { pusher } from "../pusher";
import * as errors from "../errors";

export const roomRouter = router({
  getRooms: protectedProcedure.query(async () => {
    const rooms = await DI.roomRepository.findAll({
      populate: ["id", "name", "guests.id"],
    });
    const result = [];
    for (const room of rooms) {
      result.push({
        id: room.id,
        name: room.name,
        numberOfGuests: room.guests.length,
      });
    }
    return result;
  }),
  createRoom: protectedProcedure
    .input(CreateRoomSchema)
    .mutation(async ({ input, ctx }) => {
      const roomName = input.roomName;
      const { userId } = ctx;
      const user = await DI.userRepositroy.findOne(
        {
          id: userId,
        },
        {
          populate: ["type"],
        }
      );
      if (!user) {
        throw errors.USER_NOT_FOUND;
      }
      if (!(user.type === "default")) {
        throw errors.USER_NOT_DEFAULT;
      }
      user.type = "host";
      const room = DI.roomRepository.create({
        guests: [],
        host: user,
        name: roomName,
      });
      user.room = room;
      await DI.userRepositroy.persistAndFlush(user);
      await DI.roomRepository.persistAndFlush(room);
      await pusher.trigger(`private-rooms`, "refetch", null);
    }),
  getRoom: protectedProcedure.query(async ({ ctx }) => {
    const { userId } = ctx;
    const user = await DI.userRepositroy.findOne(
      {
        id: userId,
      },
      {
        populate: ["room.id"],
      }
    );
    if (!user) {
      throw errors.USER_NOT_FOUND;
    }
    const room = await DI.roomRepository.findOne(
      {
        id: user.room?.id,
      },
      {
        populate: ["guests.username", "guests.id", "guests.type", "host.id", "host.username", "opponent.id", "opponent.username"],
      }
    );
    if (!room) {
      throw errors.ROOM_NOT_FOUND;
    }
      const guests = [];
      for (const guest of room.guests) {
        guests.push({
          username: guest.username,
          id: guest.id,
          type: guest.type,
        });
      }
      return {
        id: room.id,
        host: {
          id: room.host.id,
          username: room.host.username,
        },
        opponent: {
          id: room.opponent?.id,
          username: room.opponent?.username,
        },
        guests: guests,
      };
  }),
  joinRoom: protectedProcedure
    .input(RoomSchema)
    .mutation(async ({ input, ctx }) => {
      const room = await DI.roomRepository.findOne(
        {
          id: input.roomId,
        },
        {
          populate: ["id"],
        }
      );
      if (!room) {
        throw errors.ROOM_NOT_FOUND;
      }
      const { userId } = ctx;
      const user = await DI.userRepositroy.findOne(
        {
          id: userId,
        },
        {
          populate: ["room", "type"],
        }
      );
      if (!user) {
        throw errors.USER_NOT_FOUND;
      }
      if (!(user.type === "default")) {
        throw errors.USER_NOT_DEFAULT
      }
      if (user.room) {
        throw errors.USER_ALREADY_IN_ROOM;
      }
        user.room = room;
        if (!room.opponent) {
          user.type = "opponent";
          room.opponent = user;
        } else {
          user.type = "guest";
        }
        await DI.userRepositroy.persistAndFlush(user);
        await DI.roomRepository.persistAndFlush(room);
        await pusher.trigger(`private-room-roomId${room.id}`, "refetch", null);
        await pusher.trigger(`private-rooms`, "refetch", null);
    }),
  leaveRoom: protectedProcedure.mutation(async ({ ctx }) => {
    const { userId } = ctx;
    const user = await DI.userRepositroy.findOne(
      {
        id: userId,
      },
      {
        populate: ["room.id", "type", "id"],
      }
    );
    if (!user) {
      throw errors.USER_NOT_FOUND;
    }
    if (user.type === "default") {
      throw errors.USER_CANNOT_BE_DEFAULT
    }
    const room = await DI.roomRepository.findOne(
      {
        id: user.room?.id,
      },
      { populate: ["host.id", "opponent.id", "guests", "id"] }
    );
    if (!room) {
      throw errors.USER_HAS_NO_ROOM;
    }
    if (user.type === "host") {
      const opponent = await DI.userRepositroy.findOne({
        id: room.opponent?.id,
      });
      if (opponent) {
        opponent.type = "default";
        opponent.room = undefined;
        await DI.userRepositroy.persistAndFlush(opponent);
      }
      for (const guest of room.guests) {
        guest.type = "default";
        guest.room = undefined;
        await DI.userRepositroy.persistAndFlush(guest);
      }
      await DI.roomRepository.removeAndFlush(room);
    } else if (user.type === "opponent") {
      room.opponent = undefined;
      await DI.roomRepository.persistAndFlush(room);
    }
    const userType = user.type;
    user.type = "default";
    user.room = undefined;
    await DI.userRepositroy.persistAndFlush(user);
    await pusher.trigger(`private-room-roomId${room.id}`, "refetch", {
      isLeaving: { user: { id: user.id, isHost: userType === "host" } },
    });
    await pusher.trigger(`private-rooms`, "refetch", null);
  })
});

