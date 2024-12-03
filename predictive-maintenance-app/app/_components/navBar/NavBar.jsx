

import Link from "next/link";
import styles from "./navbar.module.css";
import Image from "next/image";
import UserProfile from "../userProfile/UserProfile";

const Navbar = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <Link href="/">
          <Image
            src="/logo.png"
            alt="MongoDB logo"
            width={240}
            height={50}
          ></Image>
        </Link>
      </div>

      

      <div className={styles.links}>
        <Link href="/">Demo Overview</Link>
        <Link href="/equipment-criticality-analysis">Equipment Criticality Analysis</Link>
        <Link href="/failure-prediction">Failure Prediction</Link>
        <Link href="/repair-plan-generation">Repair Plan Generation</Link>
      </div>

      <UserProfile></UserProfile>

    
    </nav>
  );
};

export default Navbar;