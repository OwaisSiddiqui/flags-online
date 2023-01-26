export const config = {
  runtime: "edge",
};

export default function handler(request: any, response: any) {
  // api/[name].js -> /api/lee
  // req.query.name -> "lee"
  const { name } = request.query;
  return response.end(`Hello ${name}!`);
}