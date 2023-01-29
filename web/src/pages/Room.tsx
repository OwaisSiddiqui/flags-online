import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "../utils/trpc";
import { useUser } from "../providers/userContext";
import { usePusher } from "../providers/pusherContext";

const RoomPage = () => {
  const { pusher } = usePusher();
  const navigate = useNavigate();
  const {
    isError,
    isLoading,
    data: room,
    refetch: refetchRoom,
  } = trpc.room.getRoom.useQuery(undefined, {
    retry: 0,
    onError(error) {
      if (error.data?.type === "ROOM_NOT_FOUND") {
        navigate("/home");
      }
    },
  });
  const isOpponent = useMemo(() => {
    return room?.opponent?.id;
  }, [room]);
  const { user } = useUser();

  const leaveRoom = trpc.room.leaveRoom.useMutation();
  const createGame = trpc.game.createGame.useMutation();

  useEffect(() => {
    if (!(user && pusher && room)) {
      return;
    }

    const gameChannel = pusher.subscribe(`private-game-roomId${room.id}`);
    gameChannel.bind("refetch", (data: any) => {
      const gameId = data.game.id;
      if (!gameId) {
        return;
      }
      navigate(`/game`);
    });

    const roomChannel = pusher.subscribe(`private-room-roomId${room.id}`);
    roomChannel.bind("refetch", (data: any) => {
      if (data?.isLeaving.user.id !== user?.id || data?.isLeaving.user.isHost) {
        refetchRoom();
      }
    });

    return () => {
      gameChannel.unbind_all();
      roomChannel.unbind_all();
    };
  }, [user, pusher, room]);

  if (isError) {
    return <span>Error!</span>;
  }
  if (isLoading) {
    return <span>Loading...</span>;
  }

  return (
    <div className="flex items-start content-center flex-col gap-4">
      <div>Host: {room.host.id === user?.id ? "You" : room.host.username}</div>
      <div>
        Opponent:{" "}
        {isOpponent
          ? room.opponent.id === user?.id
            ? "You"
            : room.opponent.username
          : "Waiting for an opponent..."}
      </div>
      <ul>
        Guests:
        {room.guests.map((user) => {
          if (user.type === "guest") {
            return (
              <li key={user.id} className="">
                {user.username}
              </li>
            );
          }
        })}
      </ul>
      {user?.id === room.host.id && (
        <button
          disabled={!isOpponent}
          className="bg-blue-500 text-white font-bold py-2 px-4 rounded disabled:pointer-events-none disabled:opacity-40"
          onClick={async () => {
            createGame.mutate();
          }}
        >
          {isOpponent ? "Start game" : "Waiting for an opponent..."}
        </button>
      )}
      <button
        onClick={() => {
          leaveRoom.mutateAsync().then(() => {
            navigate("/home");
          });
        }}
        className="bg-red-500 text-white font-bold py-2 px-4 rounded disabled:pointer-events-none disabled:opacity-40"
      >
        Leave room
      </button>
    </div>
  );
};

export default RoomPage;
