---
title: 'Building a Production-Grade Homelab with AI and IaC'
description: 'How I built an enterprise-style homelab with Claude Code as my AI co-pilot — VLANs, Proxmox, k3s, and a full GitOps platform, all managed with Terraform and ArgoCD.'
date: 2026-02-27
tags:
  [
    'homelab',
    'infrastructure',
    'terraform',
    'kubernetes',
    'devops',
    'ai',
    'claude',
    'open-source',
    'cncf',
  ]
draft: false
---

My homelab environment has been kind of a mess as of late. I have a lot of big ideas, but most of the time these days I'm finding that I lack the time to work on it. Something else always jumps in front of what I'm trying to do — takes priority, or a shiny thing happens (squirrel!). Over the last few years I've been buying various things for my homelab that I've been wanting to learn or experiment with, and I kept telling myself I'll eventually get to it... With the help of AI, now is that time.

With Claude Code, I set out to reconfigure and improve my homelab last week. Through ten phases of infrastructure, 30 GitHub issues, and an AI pair programmer — all shipped in under seven days.

Not the "throw a NAS in a closet" kind of homelab. This is a production-grade infrastructure platform with five VLANs, a 10-gigabit storage backbone, a three-node Kubernetes cluster, a full GitOps pipeline, and an observability stack that would make most startups jealous. Every single piece managed with Infrastructure as Code. Every tool in the stack open source. Zero vendor lock-in. Not quite zero manual configuration, but as close to it as I can get — and I'm hoping to refine and build more automation as I go.

The whole thing started with a blank GitHub repo and a question: _what would it look like to build a homelab the way you'd build a real platform — with proper IaC, proper GitOps, and an AI agent doing the heavy lifting?_

This is the story of that build.

## Starting with the Plan, Not the Code

Before I touched a single `.tf` file, I sat down and broke the project into phases. Ten of them. Each phase got its own set of GitHub issues — 30 in total — and each issue was scoped to one deliverable. Not "set up networking" but "configure VLAN trunk on RealHD switch" and "create UniFi firewall rules via Terraform." Small, testable, closeable.

The phases built on each other like layers of a cake. Foundation first — a Terraform state backend. Then the physical network. Then VLANs and firewall rules. Then Proxmox. Then compute. Then GitOps. Then observability. Then security. Then TLS. Then alerting. Each phase assumed the previous one was solid before moving on.

This structure turned out to be the single most important decision of the entire project. When something broke — and things broke constantly — I knew exactly which phase introduced the problem. When I picked the project back up after sleeping on a bug, I knew exactly where I left off. The issue tracker was the project's spine, and everything else hung off it.

## The Physical Layer

The hardware is deceptively simple. A Ubiquiti Dream Machine Pro handles routing, firewalling, VLANs, and DHCP. A RealHD SW8-10GSFPMG gives me 10-gigabit SFP+ switching between the devices that need speed. A Proxmox server runs all the VMs — dual-NIC, with 1G for management and 10G for everything else. An Asustor NAS provides storage, also dual-NIC: 1G for Plex and management traffic, 10G on a dedicated storage VLAN for NFS. A Raspberry Pi runs Pi-hole for DNS, and an AmpliFi Router HD sits in bridge mode as nothing more than a WiFi access point.

Four main devices, a Pi, and a WiFi AP. Nothing exotic. The magic isn't in the hardware — it's in how it's wired together and how it's managed.

## Five VLANs and a 10G Backbone

The network runs five VLANs. Home (192.168.1.0/24) carries management traffic, client devices, and DNS. Storage (10.20.20.0/24) is the 10G-only network between Proxmox and the NAS — nothing else touches it. Compute (10.30.30.0/24) is where the k3s cluster lives. IoT and Guest are fully isolated — internet access only, no lateral movement.

The UDM Pro enforces strict firewall rules between every VLAN. Compute can reach the Proxmox API on port 8006 for monitoring, but nothing else on the home network. IoT devices can't see the NAS. Guest devices can't see anything. Every rule is defined in OpenTofu via the UniFi provider and lives in version control. If a firewall rule isn't in a `.tf` file, it doesn't exist.

The 10G backbone on VLAN 20 is the unsung hero. Proxmox and the NAS talk at wire speed for every NFS operation — VM disk I/O, ISO transfers, Kubernetes persistent volumes. Dedicating an entire VLAN and 10G link to storage traffic means the compute and management networks never compete for bandwidth. It's the kind of thing you don't appreciate until you've watched a VM boot from a NAS over a shared 1G link.

## From VMs to a Platform

Three Ubuntu 24.04 VMs on Proxmox form a k3s cluster on VLAN 30 — one control plane node and two workers. All provisioned with Terraform and cloud-init. One `terragrunt apply` and the cluster exists. The cloud-init templates handle hostname configuration, k3s installation, and node registration automatically.

On top of k3s, ArgoCD runs the show using an app-of-apps pattern. A single root Application — bootstrapped by Terraform — watches a directory in the `homelab-gitops` repo. Want to deploy a new platform component? Drop a YAML file in that directory. ArgoCD picks it up and deploys it within minutes. No `helm install`. No `kubectl apply`. Git is the only interface.

The platform stack that ArgoCD manages reads like a CNCF landscape tour: MetalLB for L2 load balancing, Traefik for ingress with Let's Encrypt wildcard TLS via Cloudflare DNS-01, cert-manager for certificate lifecycle, an NFS provisioner for dynamic persistent volumes over the 10G link, External Secrets Operator paired with OpenBao for secrets management, kube-prometheus-stack for metrics and alerting, Loki and Alloy for log aggregation from both pods and syslog, and Falco for runtime security monitoring with eBPF.

Every single one of those tools is open source. That was a deliberate choice. OpenTofu over Terraform Cloud. OpenBao over HashiCorp Vault. Proxmox over VMware. k3s over managed Kubernetes. ArgoCD, Falco, cert-manager, and MetalLB are CNCF projects. Grafana, Loki, Alloy, and Prometheus come from Grafana Labs. The entire platform runs without a commercial license or SaaS dependency. If any project changes its license tomorrow, I'm not locked in.

## Secrets Without the Pain

Secrets follow a strict pipeline that I'm genuinely proud of. 1Password is the source of truth — every credential, API token, and certificate lives there. External Secrets Operator pulls secrets via a 1Password Service Account and creates Kubernetes Secrets automatically. OpenBao provides internal KV storage with Kubernetes authentication for anything that doesn't belong in 1Password.

The result is that no secret ever touches git. No one runs `kubectl create secret`. No one copies a password into a YAML file. A new service needs a credential? Create the item in 1Password, add an ExternalSecret manifest to the gitops repo, and ArgoCD handles the rest. It's the kind of pipeline that sounds overengineered until you realize how much time it saves and how many security mistakes it prevents.

## The AI That Actually Built It

Here's the part that surprised me most. I didn't build this platform alone. My pair programmer for the entire project was [Claude Code](https://claude.ai/claude-code) — Anthropic's AI coding agent. Not a chatbot I copy-pasted snippets from. An actual CLI agent running in my terminal, reading my codebase, writing Terraform modules, executing commands, and maintaining context across sessions.

I'd open a GitHub issue, describe what I needed, and Claude Code would work through it with me — writing the Terragrunt configurations, debugging provider quirks, authoring ArgoCD Application manifests. It understood the architecture because it had built the previous phases. It knew every IP address, every VLAN, every lesson learned, because it maintained a memory system that persisted between sessions.

The MCP integrations made it even more powerful. I connected Claude Code to my infrastructure via Model Context Protocol servers for Proxmox, UniFi, and the Terraform Registry. It could query my actual switch ports, check VM states, and read network topology in real-time while writing code against them. It wasn't guessing at my infrastructure — it was looking at it.

When cloud-init VMs all came up with the hostname "ubuntu" and the k3s nodes collided, Claude Code figured out why and fixed the cloud-init templates. When NFS mounts failed because Ubuntu 24.04 doesn't ship `nfs-common`, it diagnosed the issue and updated the node provisioning. When Loki's replication factor defaulted to 3 and broke with a single replica, it found the config flag and fixed it. These are the kinds of bugs that eat hours when you're searching Stack Overflow alone. With Claude Code, they were diagnosed and resolved in minutes.

The velocity was something I've never experienced. Ten phases of infrastructure — networking, compute, GitOps, secrets, observability, security, TLS, alerting — all 30 issues closed in under a week. That's not a testament to my typing speed. That's what happens when you combine clear issue scoping with an AI agent that understands your codebase and can operate autonomously within it.

## All of It Is on GitHub

The code is public. The [homelab-gitops](https://github.com/n2solutionsio/homelab-gitops) repo has every ArgoCD Application manifest and Helm values file — you can see exactly how each component is configured and deployed. The Terraform modules are open source too: [terraform-proxmox-vm](https://github.com/n2solutionsio/terraform-proxmox-vm) for base VM provisioning, [terraform-proxmox-k3s](https://github.com/n2solutionsio/terraform-proxmox-k3s) for the cluster, and [terraform-proxmox-network](https://github.com/n2solutionsio/terraform-proxmox-network) for Proxmox bridge and VLAN configuration.

The orchestration repo — `homelab-live` — is private by design. It contains Terragrunt configurations, environment-specific variables, and references to secrets. That's where the 30 issues live and where the phases were tracked. You get the reusable patterns and the actual code without my IP addresses and credentials.

## What's Next

This is post #1 of an eight-part series. Each post will go deep on a specific layer — the actual code, the decisions behind it, and the lessons learned the hard way. Network design. Proxmox with Terraform. k3s cluster bootstrapping. ArgoCD app-of-apps. Secrets management. The full observability stack. And a dedicated post on the Claude Code workflow that made the whole thing possible.

If you're building a homelab and want to do it with real IaC and real open-source tooling — not clicking through UIs or paying for licenses — follow along. Whether you're here for the infrastructure, the CNCF stack, the AI workflow, or all of the above, the code is open source, the process is documented, and I'm sharing everything.
