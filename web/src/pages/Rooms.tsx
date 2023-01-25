import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { GetRoomsOutput, trpc } from "../client";
import { useUser } from "../providers/userContext";
import { pusher } from "../utils/pusher";

const RoomBox = ({ room }: { room: GetRoomsOutput[number] }) => {
  const navigate = useNavigate();

  const joinRoom = trpc.room.joinRoom.useMutation();

  return (
    <div
      className="border-gray-100 border-2 px-5 py-4 w-32 rounded-lg cursor-pointer"
      onClick={async () => {
        joinRoom
          .mutateAsync({
            roomId: room.id,
          })
          .then(() => {
            navigate(`/room`);
          });
      }}
    >
      <div className="flex flex-col">
        <span className="font-sans text-xl text-black font-bold break-words">
          {room.name}
        </span>
        <span className="font-sans">{`${room.numberOfGuests} users`}</span>
      </div>
    </div>
  );
};

const RoomsPage = () => {
  const { isError, isLoading, data, refetch } = trpc.room.getRooms.useQuery();
  const { user } = useUser();
  
  const roomsChannel = pusher.subscribe("rooms")
  roomsChannel.bind("refetch", () => {
    refetch()
  })

  return (
    <div className="flex flex-1 bg-white z-2 min-w-0">
      <div className="flex flex-1 flex-col justify-between p-6 min-w-0">
        <div className="flex items-start flex-col min-w-0 gap-4">
          <h2 className="font-bold text-gray-500">ROOMS</h2>
          <div className="flex flex-wrap gap-4">
            {isError ? (
              <div>{`Error: ${isError}`}</div>
            ) : isLoading ? (
              <div>Loading...</div>
            ) : data && data.length > 0 ? (
              data.map((value, index) => {
                return <RoomBox key={index} room={value} />;
              })
            ) : (
              <span className="block italic text-gray-300">
                No rooms available
              </span>
            )}
          </div>
        </div>
        <div>
          <Link to="/create-room">
            <button className="flex shadow-lg bg-blue-500 text-white font-bold py-2 px-4 rounded">
              Create room
            </button>
          </Link>
        </div>
      </div>
      <div className="flex flex-col p-6 items-end justify-end">
        {user && (
          <div className="bg-gray-100 text-gray-400 p-2 self-end rounded-sm">
            Logged in as: {user.username}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomsPage;
