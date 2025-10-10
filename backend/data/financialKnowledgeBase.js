// Comprehensive Financial Knowledge Base for RAG System
// This contains detailed financial advice tailored for immigrants and gig workers

const financialKnowledgeBase = [
  // Credit Building
  {
    content: "For immigrants on H-1B visa, building credit is crucial for long-term financial success. Start with a secured credit card from banks like Capital One or Discover. Make small purchases monthly and pay the full balance on time. After 6-12 months, you can apply for an unsecured credit card. Keep credit utilization below 30% of your limit.",
    metadata: { 
      category: "credit", 
      visa_type: "H-1B", 
      priority: "high",
      target_audience: "immigrants",
      time_horizon: "6-12_months"
    }
  },
  {
    content: "F-1 students can build credit with student credit cards that have lower requirements. Banks like Bank of America and Wells Fargo offer special programs for international students. You'll need your passport, I-20 form, and proof of income (part-time job or financial aid). Start with a low limit and build gradually.",
    metadata: { 
      category: "credit", 
      visa_type: "F-1", 
      priority: "high",
      target_audience: "students",
      time_horizon: "3-6_months"
    }
  },
  {
    content: "Green card holders have the same credit building opportunities as US citizens. You can apply for most credit cards, auto loans, and mortgages. However, if you're new to the US, you may still need to build credit history. Consider becoming an authorized user on a family member's credit card to jumpstart your credit score.",
    metadata: { 
      category: "credit", 
      visa_type: "green_card", 
      priority: "medium",
      target_audience: "immigrants",
      time_horizon: "1-3_months"
    }
  },

  // Tax Planning
  {
    content: "Gig workers and freelancers must pay quarterly estimated taxes to avoid penalties. Set aside 25-30% of your income for taxes. Use Form 1040-ES to calculate quarterly payments. Consider opening a separate high-yield savings account specifically for tax payments. Track all business expenses including home office, equipment, and travel.",
    metadata: { 
      category: "taxes", 
      worker_type: "gig", 
      priority: "high",
      target_audience: "freelancers",
      time_horizon: "quarterly"
    }
  },
  {
    content: "H-1B workers are typically W-2 employees, so taxes are withheld automatically. However, you may be eligible for tax treaties between the US and your home country. Check if your country has a tax treaty to avoid double taxation. Consider contributing to a 401(k) to reduce taxable income and build retirement savings.",
    metadata: { 
      category: "taxes", 
      visa_type: "H-1B", 
      priority: "medium",
      target_audience: "employees",
      time_horizon: "annual"
    }
  },
  {
    content: "F-1 students on OPT or CPT may have complex tax situations. You might be considered a non-resident for tax purposes initially, which affects which tax forms you file. Consider using tax software like TurboTax or hiring a tax professional familiar with international student tax issues. Keep all your tax documents for future reference.",
    metadata: { 
      category: "taxes", 
      visa_type: "F-1", 
      priority: "high",
      target_audience: "students",
      time_horizon: "annual"
    }
  },

  // Emergency Funds
  {
    content: "Immigrants should maintain a larger emergency fund than typical recommendations. Aim for 6-12 months of expenses instead of the standard 3-6 months. This accounts for visa renewal costs, potential job transitions, and travel expenses to your home country. Keep this money in a high-yield savings account that's easily accessible.",
    metadata: { 
      category: "emergency_fund", 
      target_audience: "immigrants", 
      priority: "high",
      time_horizon: "ongoing",
      amount_range: "6-12_months_expenses"
    }
  },
  {
    content: "Gig workers need a robust emergency fund due to income volatility. Aim for 6-9 months of expenses, including both personal and business expenses. Consider having separate emergency funds: one for personal emergencies and another for business downturns. This provides stability during slow periods or client payment delays.",
    metadata: { 
      category: "emergency_fund", 
      worker_type: "gig", 
      priority: "high",
      time_horizon: "ongoing",
      amount_range: "6-9_months_expenses"
    }
  },

  // Investment Strategies
  {
    content: "Roth IRA is excellent for immigrants because contributions can be withdrawn penalty-free after 5 years. This provides flexibility if you need to return to your home country. You can contribute up to $6,500 annually (2023 limit). Choose low-cost index funds like VTSAX or VTIAX for broad market exposure. Start investing even with small amounts through dollar-cost averaging.",
    metadata: { 
      category: "investing", 
      account_type: "Roth_IRA", 
      target_audience: "immigrants",
      priority: "medium",
      time_horizon: "5+_years",
      contribution_limit: "$6500_annual"
    }
  },
  {
    content: "H-1B workers should maximize their 401(k) employer match if available. This is free money that significantly boosts your retirement savings. If your employer doesn't offer a 401(k), consider opening a Traditional IRA for tax-deferred growth. For long-term US residents, consider a mix of Traditional and Roth accounts for tax diversification.",
    metadata: { 
      category: "investing", 
      account_type: "401k", 
      visa_type: "H-1B",
      priority: "high",
      time_horizon: "long_term",
      benefit: "employer_match"
    }
  },
  {
    content: "Gig workers can open a Solo 401(k) or SEP-IRA for retirement savings. These accounts allow higher contribution limits than traditional IRAs. A Solo 401(k) lets you contribute as both employer and employee, potentially up to $66,000 annually. Consider the tax implications and your long-term plans when choosing between Traditional and Roth options.",
    metadata: { 
      category: "investing", 
      account_type: "Solo_401k", 
      worker_type: "gig",
      priority: "medium",
      time_horizon: "long_term",
      contribution_limit: "$66000_annual"
    }
  },

  // Banking and Financial Services
  {
    content: "International students should open a student checking account with no monthly fees. Many banks offer special programs for F-1 students with lower requirements. You'll typically need your passport, I-20, and proof of address. Consider online banks like Ally or Capital One 360 for better interest rates and lower fees.",
    metadata: { 
      category: "banking", 
      visa_type: "F-1", 
      priority: "high",
      target_audience: "students",
      account_type: "checking",
      fees: "no_monthly_fees"
    }
  },
  {
    content: "H-1B workers should consider premium checking accounts that offer benefits like waived fees, higher interest rates, and better customer service. Look for accounts that don't require a Social Security number initially, as you may be waiting for your SSN. Consider credit unions which often have better rates and more personalized service.",
    metadata: { 
      category: "banking", 
      visa_type: "H-1B", 
      priority: "medium",
      target_audience: "employees",
      account_type: "premium_checking"
    }
  },

  // Home Buying
  {
    content: "Green card holders can qualify for most mortgage programs including FHA loans with 3.5% down payment. However, you'll need at least 2 years of US credit history and employment history. Consider working with a mortgage broker familiar with immigrant homebuyers. Save for closing costs (2-5% of home price) in addition to the down payment.",
    metadata: { 
      category: "home_buying", 
      visa_type: "green_card", 
      priority: "medium",
      time_horizon: "2+_years",
      down_payment: "3.5%_minimum"
    }
  },
  {
    content: "H-1B workers can buy homes but may face challenges with traditional mortgages. Some lenders offer special programs for H-1B holders. You'll need a valid work permit, stable employment, and good credit. Consider the uncertainty of visa renewals when deciding on home ownership. Renting might be more flexible until you have permanent residency.",
    metadata: { 
      category: "home_buying", 
      visa_type: "H-1B", 
      priority: "low",
      time_horizon: "3+_years",
      consideration: "visa_uncertainty"
    }
  },

  // Insurance
  {
    content: "Health insurance is mandatory for most visa holders. F-1 students typically get insurance through their university. H-1B workers usually get employer-sponsored insurance. Consider supplemental insurance for dental, vision, and prescription coverage. If you're between jobs, COBRA or marketplace insurance can provide temporary coverage.",
    metadata: { 
      category: "insurance", 
      target_audience: "immigrants", 
      priority: "high",
      insurance_type: "health",
      requirement: "mandatory"
    }
  },
  {
    content: "Renters insurance is highly recommended for all immigrants. It's affordable (typically $15-30/month) and covers your personal belongings, liability, and additional living expenses. This is especially important if you're living in furnished apartments or have valuable electronics. Many landlords require it as part of the lease agreement.",
    metadata: { 
      category: "insurance", 
      target_audience: "immigrants", 
      priority: "medium",
      insurance_type: "renters",
      cost_range: "$15-30_monthly"
    }
  },

  // Budgeting and Expense Management
  {
    content: "Use the 50/30/20 rule for budgeting: 50% for needs (rent, food, transportation), 30% for wants (entertainment, dining out), and 20% for savings and debt repayment. Track expenses for at least 3 months to understand your spending patterns. Use apps like Mint, YNAB, or a simple spreadsheet to monitor your finances regularly.",
    metadata: { 
      category: "budgeting", 
      priority: "high",
      target_audience: "general",
      time_horizon: "ongoing",
      rule: "50/30/20"
    }
  },
  {
    content: "Gig workers should track both personal and business expenses separately. Use accounting software like QuickBooks or FreshBooks for business expenses. Keep detailed records of all business-related purchases, travel, and home office expenses. This helps with tax deductions and understanding your true profit margins.",
    metadata: { 
      category: "budgeting", 
      worker_type: "gig", 
      priority: "high",
      target_audience: "freelancers",
      time_horizon: "ongoing",
      separation: "personal_business"
    }
  },

  // Debt Management
  {
    content: "Avoid high-interest debt like credit cards and payday loans. If you have existing debt, prioritize paying off high-interest debt first (debt avalanche method). Consider balance transfer cards with 0% introductory APR to consolidate debt. Make minimum payments on all debts while focusing extra payments on the highest interest rate debt.",
    metadata: { 
      category: "debt_management", 
      priority: "high",
      target_audience: "general",
      method: "debt_avalanche",
      strategy: "balance_transfer"
    }
  },
  {
    content: "Student loan debt for international students can be complex. If you borrowed from your home country, consider the exchange rate impact on payments. US student loans for international students typically require a co-signer. Explore income-driven repayment plans if you're struggling with payments. Consider refinancing if you have good credit and stable income.",
    metadata: { 
      category: "debt_management", 
      target_audience: "students", 
      priority: "medium",
      loan_type: "student_loans",
      consideration: "exchange_rates"
    }
  },

  // Financial Planning for Visa Transitions
  {
    content: "Plan for visa renewal costs and potential gaps in employment. H-1B renewals can cost $2,000-5,000 including legal fees. Save for these expenses well in advance. Consider the timing of renewals and potential processing delays. Have a backup plan for income during renewal periods, such as freelance work or savings.",
    metadata: { 
      category: "visa_planning", 
      visa_type: "H-1B", 
      priority: "high",
      target_audience: "immigrants",
      cost_range: "$2000-5000",
      time_horizon: "renewal_cycle"
    }
  },
  {
    content: "Green card application process can be expensive and lengthy. Budget for legal fees ($3,000-10,000), medical exams ($500-1,000), and filing fees ($1,000-2,000). The process can take 1-3 years, so plan accordingly. Consider the impact on your career and financial goals during this period.",
    metadata: { 
      category: "visa_planning", 
      visa_type: "green_card", 
      priority: "medium",
      target_audience: "immigrants",
      cost_range: "$4500-13000",
      time_horizon: "1-3_years"
    }
  }
];

module.exports = financialKnowledgeBase;
