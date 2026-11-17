import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/providers/auth-provider";
import { ApiRequestError } from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      await registerUser(values);
      navigate("/", { replace: true });
    } catch (err) {
      setServerError(
        err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again."
      );
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <Card padding="lg">
        <h1 className="type-heading-lg text-text-primary mb-6">Create your account</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input
            label="Name"
            autoComplete="name"
            errorText={errors.name?.message}
            {...register("name")}
          />
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            errorText={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            helperText={!errors.password ? "At least 8 characters" : undefined}
            errorText={errors.password?.message}
            {...register("password")}
          />

          {serverError ? (
            <p role="alert" className="type-caption text-status-error-text">
              {serverError}
            </p>
          ) : null}

          <Button type="submit" fullWidth isLoading={isSubmitting} className="mt-2">
            Create account
          </Button>
        </form>

        <p className="type-body-small text-text-secondary mt-6 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-text-link hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
