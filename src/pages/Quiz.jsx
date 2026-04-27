import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useChurches } from '../hooks/useChurches.js';
import ChurchCard from '../components/ChurchCard.jsx';
import { IconSparkle, IconArrowLeft } from '../components/Icons.jsx';

// Each question maps user answers to "tag boosts" we then score against church tags/ministries.
const questions = [
  {
    id: 'mode',
    q: 'Are you looking for an online church or one to attend in person?',
    options: [
      { label: 'Mostly online', boosts: ['Online Only'] },
      { label: 'In-person, near me', boosts: [] },
      { label: 'A bit of both', boosts: [] }
    ]
  },
  {
    id: 'worship',
    q: 'Which worship style speaks to you?',
    options: [
      { label: 'Modern bands and contemporary songs', boosts: ['Modern Worship'] },
      { label: 'Traditional hymns and liturgy', boosts: ['Traditional', 'Liturgical', 'Choral Music'] },
      { label: 'A mix of both', boosts: ['Mixed Worship'] },
      { label: 'I\'m not sure yet', boosts: [] }
    ]
  },
  {
    id: 'teaching',
    q: 'How important is verse-by-verse Bible teaching?',
    options: [
      { label: 'Very — I want deep teaching', boosts: ['Bible Teaching'] },
      { label: 'Somewhat — balance with practical life', boosts: ['Bible Teaching'] },
      { label: 'Less — I want warmth and community first', boosts: [] }
    ]
  },
  {
    id: 'family',
    q: 'Do you have kids or teens you\'d bring along?',
    options: [
      { label: 'Yes, young kids', boosts: ['Kids Ministry'] },
      { label: 'Yes, teens', boosts: ['Youth Ministry'] },
      { label: 'Both', boosts: ['Kids Ministry', 'Youth Ministry'] },
      { label: 'No, just me', boosts: [] }
    ]
  },
  {
    id: 'groups',
    q: 'Are small groups or community circles important to you?',
    options: [
      { label: 'Yes, definitely', boosts: ['Small Groups'] },
      { label: 'Maybe later', boosts: [] },
      { label: 'Not really', boosts: [] }
    ]
  },
  {
    id: 'support',
    q: 'Are you looking for any specific support?',
    options: [
      { label: 'Counseling or grief support', boosts: ['Counseling'] },
      { label: 'Marriage / family support', boosts: ['Counseling'] },
      { label: 'Recovery (addiction, etc.)', boosts: ['Counseling'] },
      { label: 'No specific need right now', boosts: [] }
    ]
  },
  {
    id: 'newness',
    q: 'How new are you to faith or to church?',
    options: [
      { label: 'Brand new — exploring', boosts: ['New Believer Friendly'] },
      { label: 'Returning after some time away', boosts: ['New Believer Friendly'] },
      { label: 'Long-time follower', boosts: [] }
    ]
  },
  {
    id: 'size',
    q: 'What size of church feels right?',
    options: [
      { label: 'Small and tight-knit', boosts: ['small'] },
      { label: 'Medium — familiar but full', boosts: ['medium'] },
      { label: 'Large with many ministries', boosts: ['large'] },
      { label: 'No preference', boosts: [] }
    ]
  }
];

function scoreChurch(church, allBoosts) {
  let score = 0;
  for (const boost of allBoosts) {
    if (church.tags.includes(boost)) score += 3;
    if (church.ministries.some((m) => m.toLowerCase().includes(boost.toLowerCase()))) score += 2;
    if (boost === church.size) score += 2;
  }
  return score;
}

export default function Quiz() {
  const churches = useChurches();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);

  const total = questions.length;
  const current = questions[step];
  const progress = done ? 100 : Math.round((step / total) * 100);

  const recommendations = useMemo(() => {
    if (!done) return [];
    const allBoosts = Object.values(answers).flatMap((a) => a.boosts);
    const ranked = churches
      .map((c) => ({ church: c, score: scoreChurch(c, allBoosts) }))
      .sort((a, b) => b.score - a.score);
    const top = ranked.filter((r) => r.score > 0).slice(0, 4);
    return top.length > 0 ? top : ranked.slice(0, 3);
  }, [answers, done, churches]);

  const select = (option) => {
    const next = { ...answers, [current.id]: option };
    setAnswers(next);
    setTimeout(() => {
      if (step + 1 < total) setStep(step + 1);
      else setDone(true);
    }, 220);
  };

  const restart = () => {
    setStep(0);
    setAnswers({});
    setDone(false);
  };

  if (done) {
    return (
      <div className="page fade-in">
        <div className="quiz-card">
          <div className="quiz-progress"><div className="bar" style={{ width: '100%' }} /></div>
          <div className="quiz-results">
            <IconSparkle width="32" height="32" style={{ color: 'var(--gold-deep)' }} />
            <h2>Here's where to start</h2>
            <p>Based on your answers, these churches might feel like a good fit.</p>
          </div>
          <button className="btn btn-ghost btn-block" onClick={restart}>Retake the quiz</button>
        </div>

        <div className="section-head">
          <h2 style={{ fontStyle: 'italic', fontWeight: 400 }}>Recommended for you</h2>
        </div>
        <div className="church-grid">
          {recommendations.map(({ church }) => (
            <ChurchCard key={church.id} church={church} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page fade-in">
      <div className="quiz-card">
        <div className="quiz-progress">
          <div className="bar" style={{ width: `${progress}%` }} />
        </div>
        <div className="quiz-step-num">Question {step + 1} of {total}</div>
        <div className="quiz-q">{current.q}</div>

        <div className="quiz-options">
          {current.options.map((opt) => {
            const selected = answers[current.id]?.label === opt.label;
            return (
              <button
                key={opt.label}
                className={`quiz-option${selected ? ' selected' : ''}`}
                onClick={() => select(opt)}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="quiz-nav">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            style={{ opacity: step === 0 ? 0.5 : 1 }}
          >
            <IconArrowLeft width="14" height="14" /> Back
          </button>
          <Link to="/" className="btn-link">Skip the quiz</Link>
        </div>
      </div>
    </div>
  );
}
