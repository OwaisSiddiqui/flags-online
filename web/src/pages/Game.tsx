import React, { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Question, trpc } from "../utils/trpc";
import { usePusher } from "../providers/pusherContext";
import { useUser } from "../providers/userContext";

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
  const { user } = useUser()
  const { pusher } = usePusher()
  const navigate = useNavigate();

  const [winner, setWinner] = useState<string>();

  const { data: game } = trpc.game.getGame.useQuery()

  const { data: penalty, refetch: refetchPenalty } =
    trpc.game.getPenalty.useQuery(undefined, {
      enabled: !winner,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      trpc: {
        abortOnUnmount: true
      }
    });
  const { data: question, refetch: refetchCurrentQuestion } =
    trpc.game.currentQuestion.useQuery(undefined, {
      enabled: !winner,
      retry: 0,
      refetchOnWindowFocus: false
    });

  useEffect(() => {
    if (!(user && pusher && game)) {
      return;
    }

    const penaltyChannel = pusher.subscribe(`private-penalty-userId${user.id}`)
    penaltyChannel.bind("refetch", () => {
      console.log("Refetch!")
      refetchPenalty()
    })

    const currentQuestionChannel = pusher.subscribe(`private-currentQuestion-gameId${game.id}`)
    currentQuestionChannel.bind("refetch", () => {
      refetchCurrentQuestion()
    })

    const endGameChannel = pusher.subscribe(`private-endGame-gameId${game.id}`)
    endGameChannel.bind("refetch", (winner: string) => {
      setWinner(winner)
    })

    return () => {
      penaltyChannel.unbind_all()
      currentQuestionChannel.unbind_all()
      endGameChannel.unbind_all()
    }
  }, [user, pusher, game])

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
