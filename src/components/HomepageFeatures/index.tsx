import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  // Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Domain',
    // Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Event-sourced Aggregate base classes and Aggregate Store building blocks to build your domain model,
        and persist state transitions as events.
      </>
    ),
  },
  {
    title: 'Subscriptions',
    // Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
          Real-time subscriptions to support event reactors and read model projections,
          using EventStoreDB, Google PubSub, and RabbitMQ.
      </>
    ),
  },
  {
    title: 'EventStoreDB',
    // Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
          Aggregate persistence, subscriptions, and event producers backed by EventStoreDB.
      </>
    ),
  },
];

function Feature({title, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
          {/*<i className="fas fa-sitemap"/>*/}
        {/*<Svg className={styles.featureSvg} role="img" />*/}
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
