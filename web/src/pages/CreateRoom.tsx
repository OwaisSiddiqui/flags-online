import React from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "../client";
import { SubmitHandler, useForm } from "react-hook-form";

interface IFormInput {
  roomName: string;
}

const CreateRoom = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IFormInput>();
  const onSubmit: SubmitHandler<IFormInput> = (data) => {
    const roomName = data.roomName;
    addRoom
      .mutateAsync({
        roomName: roomName,
      })
      .then(() => {
        navigate(`/room`);
      });
  };
  const navigate = useNavigate();
  const addRoom = trpc.room.addRoom.useMutation();

  return (
    <div className="flex-1 bg-white p-6 inset-0 z-2">
      <h2 className="font-bold text-black mb-4 text-3xl">Create a Room</h2>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex items-start flex-col"
      >
        <label className="mb-2 text-gray-500" htmlFor="room-name">
          Room name
        </label>
        <input
          {...register("roomName", { required: "Room name is required." })}
          className="border-2 rounded border-gray-300 p-2 text-gray-400"
          type="text"
        />
        {errors.roomName && (
          <span>{`Errors here: ${errors.roomName.message}`}</span>
        )}
        <button
          className="flex shadow-lg bg-green-500 text-white font-bold py-2 px-4 rounded mt-6"
          type="submit"
        >
          Create and Join Room
        </button>
      </form>
    </div>
  );
};

export default CreateRoom;
