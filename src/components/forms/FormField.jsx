import { Input } from "@/components/ui/Input";

/**
 * Wires a react-hook-form `register` + `errors` object into an <Input>
 * without repeating the error-lookup boilerplate on every field.
 */
export function FormField({ name, register, errors, ...inputProps }) {
  return <Input {...register(name)} error={errors?.[name]?.message} {...inputProps} />;
}