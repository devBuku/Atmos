import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type Props = {
  location: string;
  onLocationChange: (location: string) => void;
};

function LocationDropdown({ location, onLocationChange }: Props) {
  const locations = [
    "Bankok",
    "New York",
    "London",
    "Paris",
    "Tokyo",
    "Sydney",
    "Berlin",
    "Moscow",
    "Rio de Janeiro",
    "Cape Town",
  ];
  return (
    <Select
      value={location}
      onValueChange={(value) => {
        if (value !== null) onLocationChange(value);
      }}
    >
      <SelectTrigger className="w-45">
        <SelectValue placeholder="Location" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {locations.map((location) => (
            <SelectItem key={location} value={location}>
              {location}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export default LocationDropdown;
