import React, { PropsWithChildren, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Question, trpc } from "../client";
import { pusher } from "../utils/pusher";

const Option = ({
  question,
  option,
}: {
  question: Question;
  option: Question["options"][number];
}) => {
  const handleAnswer = trpc.game.handleAnswer.useMutation();

  return (
    <li
      onClick={async () => {
        handleAnswer.mutate({
          flagName: option.country,
          questionId: question.id,
        });
      }}
      key={option?.country}
      className={`cursor-pointer py-2 px-41`}
    >
      {option?.country}
    </li>
  );
};

const QuestionComponent = ({
  children,
  question,
}: PropsWithChildren<{ question: Question }>) => {
  return (
    <div className={`flex-col gap-3`}>
      <img
        className="transition duration-300 transform"
        height="500px"
        width="500px"
        src={question.flag.url}
      />
      <ul className="bg-gray-800 rounded-md text-white shadow-md py-4 px-4 outline-none">
        {children}
      </ul>
    </div>
  );
};

const Game = () => {
  const navigate = useNavigate();

  const [winner, setWinner] = useState<string>();

  const { data: penalty, refetch: refetchPenalty } =
    trpc.game.getPenalty.useQuery(undefined, {
      enabled: !winner
    });
  const { data: question, refetch: refetchCurrentQuestion } =
    trpc.game.getCurrentQuestion.useQuery(undefined, {
      enabled: !winner,
      retry: 0,
      refetchOnWindowFocus: false
    });

  const penaltyChannel = pusher.subscribe("penalty")
  penaltyChannel.bind("refetch", () => {
    refetchPenalty()
  })

  const currentQuestionChannel = pusher.subscribe("currentQuestion")
  currentQuestionChannel.bind("refetch", () => {
    refetchCurrentQuestion()
  })

  const endGameChannel = pusher.subscribe("endGame")
  endGameChannel.bind("refetch", (winner: string) => {
    setWinner(winner)
  })

  return (
    <div className="flex flex-col p-5 gap-5 w-full items-center justify-center bg-gray-900">
      <div className="flex flex-col gap-5">
        {winner ? (
          <div className="text-lg text-white">
            <h1 className="text-lg text-white">Game over!</h1>
            {winner === "tie" ? "It's a tie!" : `The winner is ${winner}!`}
            <br />
            <button
              onClick={() => {
                navigate("/room");
              }}
              className="bg-teal-500 text-white font-bold py-2 px-4 rounded disabled:pointer-events-none disabled:opacity-40"
            >
              Return to room
            </button>
          </div>
        ) : question ? (
          <>
            <QuestionComponent question={question}>
              {question.options.map((option) => {
                return (
                  <Option key={option.id} question={question} option={option} />
                );
              })}
            </QuestionComponent>
            <span
              className={`p-4 rounded-md ${
                penalty === 0
                  ? "bg-transparent"
                  : "bg-red-300 text-red-800 font-bold"
              }`}
            >
              Penalty Timer: {penalty}
            </span>
          </>
        ) : (
          <span>Error!</span>
        )}
      </div>
    </div>
  );
};

export default Game;
