import SignUpScreen from "./signup-screen";

interface PageProps {
  searchParams: Promise<{ plan?: string }>;
}

export default async function SignUpPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return <SignUpScreen plan={params?.plan} />;
}

