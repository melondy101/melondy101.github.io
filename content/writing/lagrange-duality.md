---
title: "Where the Name 'Lagrange Duality' comes from"
date: 2026-03-04T09:31:47+08:00
draft: false
share: true
tags:
  - optimization
categories:
  - machine learning theory
math: true
description: "Understanding Lagrange duality from geometric intuition to the dual problem"
---

---

# Where the Name *Lagrange Duality* Comes From

## Overview

Many optimization problems in machine learning involve **constraints**.
Examples include:

* margin constraints in Support Vector Machines
* probability simplex constraints
* regularization constraints

A powerful framework for handling these problems is **Lagrange duality**.

Conceptually, Lagrange duality does two key things:

1. **Incorporates constraints into the objective function** using *Lagrange multipliers*
2. **Constructs a new optimization problem** (the *dual problem*) by exchanging minimization and maximization

The dual formulation is often useful because it may

* be **easier to solve**
* reveal **hidden structure** in the problem
* enable techniques such as the **kernel trick** in SVMs

In this post we gradually build the idea of Lagrange duality:

1. Geometric intuition of constrained optimization
2. Lagrangian formulation
3. Dual problem and weak duality
4. Strong duality and KKT conditions
5. Example: Support Vector Machines



---

# 1. Geometry of Constrained Optimization

Consider the constrained optimization problem

$$
\min_w f(w)
$$

subject to

$$
h(w) = 0
$$

* The constraint defines a **surface**
* The objective function defines a **landscape**

We are searching for the **lowest point of the landscape that lies on the surface**.

A useful analogy is a **valley with a fence**:

* the valley represents the objective function
* the fence represents the constraint surface
* we must find the lowest point we can reach **without crossing the fence**

At the optimal point ($w^*$), we cannot move along the surface in a direction that decreases $f$.

This implies an important geometric condition:

$$
\nabla f(w^*) \text{ must be orthogonal to the constraint surface}
$$

But the gradient of the constraint function $h$ is also normal to the surface.

Therefore the gradients must be aligned:

$$
\nabla f(w^\*) = \beta \nabla h(w^\*)
$$

This is the core idea behind the **Lagrange multiplier method**, introduced by
Joseph-Louis Lagrange.

---

### Concept Box — Geometric Meaning of Lagrange Multipliers

At the constrained optimum:

* the gradient of the objective cannot point along the feasible surface
* therefore it must be a **linear combination of constraint gradients**

This is the geometric foundation of the **Lagrangian method**.

---

### Section Summary

Constrained optimization changes the usual optimality condition:

| Unconstrained         | Constrained                             |
| --------------------- | --------------------------------------- |
| $$\nabla f(w^\*) = 0$$ | $$\nabla f(w^\*) = \beta \nabla h(w^\*)$$ |

The constraint introduces a **balancing force** represented by the multiplier.


---

# 2. From Constraints to the Lagrangian

Now we move from geometry to algebra.

We want to solve

$$
\min_w f(w)
$$

subject to

$$
h(w) = 0
$$

The difficulty is that $w$ cannot vary freely.

## A Naive Idea: Penalty Methods

One approach is to penalize violations:

$$
f(w) + \rho |h(w)|
$$

where $\rho$ is a large constant.

Interpretation:

* if $h(w)=0$ → no penalty
* if $h(w)\neq0$ → objective increases

However this approach has a problem:

* choosing $\rho$ is difficult
* small $\rho$ ignores constraints
* large $\rho$ causes instability

---

## Adaptive Penalties

Instead of fixing the penalty weight, we treat it as a variable:

$$
f(w) + \beta h(w)
$$

Here $\beta$ is **not predetermined**.

Instead, it is allowed to adjust automatically during optimization.

---

### Concept Box — Adaptive Penalty Idea

The optimization behaves like a **two-player game**:

* $w$ tries to **minimize the objective**
* the multiplier $\beta$ tries to **increase the objective when constraints are violated**

This dynamic adjustment enforces feasibility automatically.

---

## The Lagrangian

This leads to the **Lagrangian function**

$$
L(w,\beta) = f(w) + \beta h(w)
$$

where $\beta$ is called a **Lagrange multiplier**.

---

### Section Summary

The Lagrangian converts a constrained problem into a form where

* constraints become **penalty terms**
* multipliers control **penalty strength**


---

# 3. Extending to General Constraints

Real machine learning problems typically include both **inequality** and **equality** constraints:

$$
\min_w f(w)
$$

subject to

$$
g_i(w) \le 0
$$

$$
h_i(w) = 0
$$

The **general Lagrangian** is

$$
L(w,\alpha,\beta) = f(w) + \sum_i \alpha_i g_i(w) + \sum_i \beta_i h_i(w)
$$

with

$$
\alpha_i \ge 0
$$

---

### Concept Box — Why $\alpha_i \ge 0$?

For inequality constraints:

* if $g_i(w) > 0$ (violation) → $\alpha_i g_i(w) > 0$ increases the objective
* if $g_i(w) < 0$ → increasing $\alpha_i$ would decrease the objective, so optimal $\alpha_i = 0$

Therefore **only active constraints can have positive multipliers**.

This idea will later appear as **complementary slackness**.

---

### Section Summary

The Lagrangian incorporates constraints using multipliers:

| Constraint     | Multiplier               |
| -------------- | ------------------------ |
| $g_i(w)\le0$ | $\alpha_i\ge0$         |
| $h_i(w)=0$   | $\beta_i$ unrestricted |


---

# 4. From Lagrangian to Duality

The constrained problem can be written as

$$
\min_w \max_{\alpha,\beta} L(w,\alpha,\beta)
$$

This is a **min–max problem**.

Now consider reversing the order:

$$
\max_{\alpha,\beta} \min_w L(w,\alpha,\beta)
$$

This leads to the **dual problem**.

---

## The Dual Function

Fix multipliers $\alpha,\beta$ and minimize over $w$:

$$
\theta_D(\alpha,\beta) = \min_w L(w,\alpha,\beta)
$$

This is called the **dual function**.

---

### Concept Box — Meaning of the Dual Function

Multipliers define a **penalty rule**.

The dual function asks:

> Given this rule, what is the smallest objective value achievable?

---

## Weak Duality

For any multipliers

$$
\theta_D(\alpha,\beta) \le p^*
$$

where $p^*$ is the optimal primal value.

Thus the dual function provides a **lower bound**.

The dual problem chooses the best bound:

$$
d^* = \max_{\alpha,\beta} \theta_D(\alpha,\beta)
$$

This property is called **weak duality**.

---

### Section Summary

Dual optimization searches for the **tightest lower bound** on the primal objective.


# 5. Strong Duality and KKT Conditions

Sometimes the bound becomes exact:

$$
d^* = p^*
$$

This property is called **strong duality**.

A key result from convex optimization states that strong duality holds when

* the problem is **convex**
* **Slater's condition** holds

Slater's condition requires a strictly feasible point:

$$
g_i(w) < 0
$$

---

## KKT Conditions

When strong duality holds, optimal solutions satisfy the **Karush–Kuhn–Tucker (KKT) conditions**.

These include:

1. **Primal feasibility**

$$
g_i(w^\*) \le 0, \quad h_i(w^\*) = 0
$$

2. **Dual feasibility**

$$
\alpha_i \ge 0
$$

3. **Stationarity**

$$
\nabla f(w^*) = \sum_i \alpha_i^* \nabla g_i(w^*) + \sum_i \beta_i^* \nabla h_i(w^*)
$$

4. **Complementary slackness**

$$
\alpha_i g_i(w^*) = 0
$$

---

### Concept Box — Complementary Slackness

For each constraint:

- inactive constraint → multiplier (=0)
- active constraint → multiplier may be positive

Thus **only active constraints influence the solution**.

---

### Section Summary

KKT conditions connect the primal and dual problems and characterize optimal solutions.


# 6. Example: Support Vector Machines

Consider training data

$$
(x_i,y_i),\quad y_i\in{-1,1}
$$

The SVM optimization problem is

$$
\min_{w,b} \frac12 |w|^2
$$

subject to

$$
y_i(w^T x_i + b) \ge 1
$$

---

## Lagrangian

Introduce multipliers $\alpha_i \ge 0$:

$$
L(w,b,\alpha) = \frac12 |w|^2 - \sum_i \alpha_i (y_i(w^T x_i+b)-1)
$$

---

## Stationarity

Setting derivatives to zero gives

$$
w = \sum_i \alpha_i y_i x_i
$$

$$
\sum_i \alpha_i y_i = 0
$$

Substituting back yields the **dual problem**.

---

## Support Vectors

Complementary slackness implies

$$
\alpha_i (y_i(w^Tx_i+b)-1)=0
$$

Thus

* if $y_i(w^Tx_i+b) >1$ → $\alpha_i=0$
* if $\alpha_i>0$ → point lies exactly on the margin

These points are called **support vectors**.

---

### Concept Box — Why SVM Is Sparse

Only support vectors have non-zero multipliers.

Therefore the classifier becomes

$$
f(x) = \text{sign}\left( \sum_{i\in SV} \alpha_i y_i (x_i^Tx) + b \right)
$$

---

## Kernel Trick

Because the classifier depends only on inner products $x_i^T x$, we can replace them with kernel functions:

$$
K(x_i,x_j)
$$

This allows nonlinear decision boundaries.

---

### Section Summary

The SVM example shows how

* duality simplifies optimization
* KKT reveals sparsity
* kernels enable nonlinear models



# Conclusion

Lagrange duality provides a unified framework for solving constrained optimization problems.

The key ideas are:

* **Lagrange multipliers** convert constraints into penalties
* the **dual problem** provides lower bounds on the optimal value
* **weak duality** guarantees the bound
* **strong duality** makes the bound exact
* **KKT conditions** characterize optimal solutions

In machine learning, these ideas appear frequently, from support vector machines to modern convex optimization algorithms.

Understanding Lagrange duality therefore provides both **theoretical insight and practical tools** for solving constrained problems.
