"use client";

import styles from "./overviewComp.module.css";

import {
    H1, H3, Body, Description, Link
} from "@leafygreen-ui/typography";
import Card from "@leafygreen-ui/card";


const OverviewComp = () => {

    return (
        <div className={styles.body}>
            
            <H1 className={styles.pageTitle}>Welcome to the Predictive Maintenance Demo!</H1>

           <img src="/demooverview.png" className={styles.architectureImage} alt="Flow"></img> 

            <H3 className={styles.compTitle}>Check out our related resources!</H3>

            <div className={styles.container}>

                <Card className={styles.card}>
                    <a className={styles.title} href="https://www.mongodb.com/resources/solutions/use-cases/generative-ai-predictive-maintenance-applications">
                        <img src="/read.png" className={styles.image} alt="Retail"></img>
                        <H3 className={styles.title}>White Paper</H3>
                    </a>
                    <Description className={styles.description}> Learn more about using generative AI to achieve maintenance excellence. 
 
                    </Description>

                    <Link
                        href="https://www.mongodb.com/resources/solutions/use-cases/generative-ai-predictive-maintenance-applications"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.button}
                    >
                        Read the paper
                    </Link>
                </Card>


                <Card className={styles.card}>
                    <a className={styles.title} href="https://github.com/mongodb-industry-solutions/Predictive-Maintenance-Hosted">
                        <img src="/github.png" className={styles.image} alt="Insurance"></img>
                        <H3 className={styles.title}>Github Repo</H3>
                    </a>
                    <Description className={styles.description}> Follow the step-by-step guide and play around with the demo yourself.
                    </Description>
                    <Link
                        href="https://github.com/mongodb-industry-solutions/Predictive-Maintenance-Hosted"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.button}
                    >
                        Try the Demo
                    </Link>
                </Card>

                <Card className={styles.card}>
                    <a className={styles.title} href="https://www.youtube.com/watch?v=YwTWpUl3QS8">
                        <img src="/youtube.png" className={styles.image} alt="Insurance"></img>
                        <H3 className={styles.title}>YouTube Video</H3>
                    </a>
                    <Description className={styles.description}> Explore how MongoDB can be leveraged to create a comprehensive predictive maintenance strategy for the manufacturing and automotive industries.
                    </Description>
                    <Link
                        href="https://www.youtube.com/watch?v=YwTWpUl3QS8"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.button}
                    >
                        Watch the Video
                    </Link>
                </Card>

            </div>


        </div>
    );
};

export default OverviewComp;