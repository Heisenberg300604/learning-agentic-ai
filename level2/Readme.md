# Agents

what is the current weather ? - normal llm without tool cant tell it 
but with tools ? 
 
Question -> LLM -> Analyzer -> Tool -> LLM -> Response

issi cheez ko AI agent bolte hai !


An agent can 
- understand the goal 
- make decisions
- select tools
- execute actions
- observe the result
- change its next actions
- stop when the task is complete


## Approaches for Building an Agent
- use Langchain 
- use LangGraph


# LangGraph
LangGraph is a framework for building stateful, multi-step AI agents that can make decisions, execute tools, repeat tasks, and maintain context throughout a workflow

There are five concepts you should understand first

State -	Shared memory/data of the workflow
Nodes -	Individual tasks performed by the agent
Edges -	Connections between tasks
Conditional Edges -	Decisions about which task runs next
Graph -	Complete workflow connecting everything
