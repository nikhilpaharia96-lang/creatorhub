import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/providers/auth-provider";
import { ApiRequestError } from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      await login(values);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(
        err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again."
      );
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <Card padding="lg">
        <h1 className="type-heading-lg text-text-primary mb-6">Sign in</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
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
            autoComplete="current-password"
            errorText={errors.password?.message}
            {...register("password")}
          />

          {serverError ? (
            <p role="alert" className="type-caption text-status-error-text">
              {serverError}
            </p>
          ) : null}

          <Button type="submit" fullWidth isLoading={isSubmitting} className="mt-2">
            Sign in
          </Button>
        </form>

        <p className="type-body-small text-text-secondary mt-6 text-center">
          Don't have an account?{" "}
          <Link to="/register" className="text-text-link hover:underline">
            Create one
          </Link>
        </p>
      </Card>
    </div>
  );
}
