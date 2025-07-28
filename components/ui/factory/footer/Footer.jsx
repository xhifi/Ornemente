import { FacebookIcon, InstagramIcon } from "lucide-react";

const Footer = () => {
  return (
    <div className="px-6 py-12 bg-secondary">
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="lg:w-1/5 md:w-2/5 w-full">
          <h2 className="mb-3 font-bold text-lg tracking-wide">Contact Us</h2>
          <ul>
            <li>21 Km Ferozpur Road Lahore Pakistan.</li>
            <li>nishatonline@nishatmills.com</li>
            <li>+92 42 111 647 428</li>
          </ul>
        </div>
        <div className="lg:w-1/5 md:w-2/5 w-full">
          <h2 className="mb-3 font-bold text-lg tracking-wide">Information</h2>
          <ul>
            <li>Blogs</li>
            <li>About Us</li>
            <li>Catalogues</li>
            <li>Privacy Policy</li>
            <li>Terms & Conditions</li>
          </ul>
        </div>
        <div className="lg:w-1/5 md:w-2/5 w-full">
          <h2 className="mb-3 font-bold text-lg tracking-wide">Customer Services</h2>
          <ul>
            <li>FAQs</li>
            <li>Order Tracking</li>
            <li>Contact Us</li>
            <li>Return & Exchange Policy</li>
          </ul>
        </div>
        <div className="lg:w-2/5 w-full space-y-2">
          <h2 className="mb-3 font-bold text-lg tracking-wide">Newsletter Signup</h2>
          <p>Subscribe to our newsletter to stay updated</p>
          <form className="flex flex-row items-center gap-2 border p-1 w-full focus-within:border-primary">
            <input type="email" name="email" autoComplete="email" className="w-full px-3 py-1 outline-none" />
            <button className="bg-primary text-secondary px-3 py-1.5 text-nowrap">Subscribe</button>
          </form>
          <ul className="flex items-center gap-1">
            <li>
              <FacebookIcon className="text-blue-500" />
            </li>
            <li>
              <InstagramIcon className="text-pink-600 " />
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Footer;
