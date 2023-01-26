import React, { FormEvent, useRef, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { trpc } from "../utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUser } from "../providers/userContext";

interface LoginFormInput {
  username: string;
  password: string;
}

interface SignupFormInput {
  username: string;
  password: string;
  repeatPassword: string;
}

const SignupFormSchema = z.object({
  username: z.string(),
  password: z.string(),
  repeatPassword: z.string(),
});

const LoginFormSchema = z.object({
  username: z.string(),
  password: z.string()
});

const SignupForm = () => {
  const { setToken } = useUser();

  const signup = trpc.user.signup.useMutation();
  const isUserExist = trpc.user.isUserExist.useMutation();

  const { register, handleSubmit, setError, clearErrors, formState: { errors } } = useForm<SignupFormInput>({
    resolver: zodResolver(SignupFormSchema),
  });
  
  const onSubmit: SubmitHandler<SignupFormInput> = (data) => {
    signup
      .mutate({
        username: data.username,
        password: data.password,
        repeatPassword: data.repeatPassword,
      }, {
        onSuccess(data) {
          setToken(data)
        }
      })
  };

  const { ref, ...rest } = {...register("password", { required: true })}
  const passwordInputRef = useRef<HTMLInputElement | null>()

  return (
    <form
      className="flex flex-col gap-5 items-center jusitfy-center"
      onSubmit={handleSubmit(onSubmit)}
    >
      <input
        {...register("username", { required: true, onBlur: async (event) => {
          const username = event.currentTarget.value
          if (username) {
            const isUserExistsValue = await isUserExist.mutateAsync({
              username: username
            })
            if (isUserExistsValue) {
              setError("username", {message: "Username already exists"}, {shouldFocus: true})
            } else {
              clearErrors("username")
            }
          }
        }})}
        placeholder="Username"
        type="text"
        className="text-xl px-6 py-4 drop-shadow-md bg-white border-white border-2 rounded-full"
      />
      {errors.username?.message === "Username already exists" && <span className="break-words p-3 text-center bg-red-100 rounded-lg text-red-500">Username already exists</span>}
      <input
        {...rest}
        placeholder="Password"
        type="password"
        className="text-xl px-6 py-4 drop-shadow-md bg-white border-white border-2 rounded-full"
        ref={(e) => {
          ref(e)
          passwordInputRef.current = e
        }}
      />
      {errors.password?.message === "Required" && <span>Password is required.</span>}
      <input
        {...register("repeatPassword", { required: true, onBlur: (event: FormEvent<HTMLInputElement>) => {
          const repeatPassword = event.currentTarget.value
          const password = passwordInputRef.current?.value
          if (password && repeatPassword !== password) {
            setError("repeatPassword", {message: "Password and repeat password are not the same"})
          } else {
            clearErrors("repeatPassword")
          }
        }})}
        placeholder="Repeat Password"
        type="password"
        className="text-xl px-6 py-4 drop-shadow-md bg-white border-white border-2 rounded-full"
      />
      {errors.repeatPassword?.message === "Required" && <span>Repeat password is required.</span>}
      {errors.repeatPassword?.message === "Password and repeat password are not the same" && <span className="break-words p-3 text-center bg-red-100 rounded-lg text-red-500">Password and repeat password are not the same.</span>}
      <span className="break-words p-3 text-center bg-red-100 rounded-lg text-red-500">
        {
          "Don't use any passwords you commonly use as it's not securely stored."
        }
      </span>
      <button
        type="submit"
        className="bg-transparent w-32 rounded-full text-lg py-3 text-black border-4"
      >
        Sign Up
      </button>
    </form>
  );
};

const LoginForm = () => {
  const loginUser = trpc.user.login.useMutation();
  const { setToken } = useUser();

  const isUserExist = trpc.user.isUserExist.useMutation();
  const [loginError, setLoginError] = useState<string>()

  const { register, handleSubmit, formState: { errors }, clearErrors, setError } = useForm<SignupFormInput>({
    resolver: zodResolver(LoginFormSchema),
  });
  const onSubmit: SubmitHandler<LoginFormInput> = async (data) => {
    loginUser.mutate({
      username: data.username,
      password: data.password,
    }, {
      onSuccess(data) {
        setToken(data)
      },
      onError(error) {
        if (error.data?.type === "INCORRECT_PASSWORD") {
          setLoginError("Password was not correct")
          return ""
        }
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5 items-center jusitfy-center"
    >
      <input
        {...register("username", { required: true, onBlur: async (event) => {
          const value = event.currentTarget.value
          if (value) {
            const isUserExistsValue = await isUserExist.mutateAsync({
              username: value
            })
            if (!isUserExistsValue) {
              setError("username", {message: "User does not exist"}, {shouldFocus: true})
            }
          } else {
            clearErrors("username")
          }
        } })}
        placeholder="Username"
        type="text"
        name="username"
        className="text-xl px-6 py-4 drop-shadow-md bg-white border-white border-2 rounded-full"
      />
      {errors.username?.message === "User does not exist" && <span className="bg-red-300 text-red-700 p-4">Username does not exist</span>}
      <input
        {...register("password", { required: true })}
        placeholder="Password"
        type="password"
        name="password"
        className="text-xl px-6 py-4 drop-shadow-md bg-white border-white border-2 rounded-full"
      />
      {loginError && <span className="bg-red-300 text-red-700 p-4">{loginError}</span>}
      <button
        type="submit"
        className="bg-transparent w-32 rounded-full text-lg py-3 text-black border-4"
      >
        Log In
      </button>
    </form>
  );
};

export const Landing = () => {
  const [isLogin, setIsLogin] = useState(false);

  return (
    <div className="bg-[url('public/images/flags-hero.png')] bg-no-repeat bg-center flex items-center justify-center w-screen h-screen bg-cover">
      <div className="flex self-center items-center justify-center flex-col gap-20 p-10">
        <h1 className="text-center drop-shadow-xl font-sans text-5xl text-white font-black">
          Guess The World Flag - Multiplayer
        </h1>
        <div
          className="flex flex-col gap-5 items-center jusitfy-center bg-white p-5 rounded-md w-96 h-96 overflow-y-auto"
          style={{ scrollbarGutter: "stable" }}
        >
          <div className="flex gap-10 bg-white border-b-2 border-gray-200 pb-5">
            <button
              onClick={() => {
                setIsLogin(true);
              }}
              className={`${isLogin ? "bg-gray-200" : ""} p-5 rounded-md`}
            >
              Log In
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
              }}
              className={`${!isLogin ? "bg-gray-200" : ""} p-5 rounded-md`}
            >
              Sign Up
            </button>
          </div>
          {isLogin ? <LoginForm /> : <SignupForm />}
        </div>
      </div>
    </div>
  );
};
