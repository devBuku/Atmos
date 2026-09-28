import { useSuspenseQuery } from "@tanstack/react-query";
import { getWeather } from "../../api";
import Card from "./Card";

type Props = {};

function CurrentWeather({}: Props) {
  //@ts-ignore
  const { data } = useSuspenseQuery({
    queryKey: ["weather"],
    queryFn: () => getWeather({ lat: 10, lon: 25 }),
  });
  return <Card title="Current Weather">Current Weather</Card>;
}

export default CurrentWeather;
