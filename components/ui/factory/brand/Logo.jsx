import Link from "next/link";

const Logo = ({ ...rest }) => {
  return (
    <Link href="/" {...rest}>
      <span className=" text-2xl tracking-tighter font-light bg-fuchsia-200 px-2 py-1 text-nowrap">Samra Khanumz</span>
    </Link>
  );
};

export default Logo;
